// @vitest-environment node
import { Effect, Layer, Option, Redacted } from 'effect'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BotIdVerifier } from './botId'
import { ContactConfig } from './config'
import { Mailer } from './email'
import { EmailDomainVerifier } from './emailDomain'
import { SendFailed, TurnstileFailed } from './errors'
import { createFormToken } from './formToken'
import { handleContactSubmission, resolveClientIp } from './handler'
import { ContactLog } from './log'
import { RateLimiter } from './rateLimit'
import { Turnstile } from './turnstile'
import type { ContactSettings } from './config'
import type { ConfigurationError } from './errors'
import type { OutgoingContactMessage } from './email'
import type { ContactRequestContext } from './handler'
import type { LogEntry } from './log'
import type { TurnstileVerifyInput } from './turnstile'

const SECRET = 'form-token-secret-for-tests'
const REQUEST: ContactRequestContext = { realIp: undefined, forwardedFor: undefined, socketIp: '192.0.2.10', host: 'localhost:4100' }

interface Scenario {
    config?: Partial<ContactSettings>
    turnstile?: Effect.Effect<void, TurnstileFailed | ConfigurationError>
    isBot?: boolean
    disposable?: boolean
    mx?: () => Promise<ReadonlyArray<{ exchange: string }>>
    mailer?: Effect.Effect<void, SendFailed | ConfigurationError>
}

let sent: Array<OutgoingContactMessage>
let turnstileCalls: Array<TurnstileVerifyInput>
let entries: Array<LogEntry>

/** Fields of every log entry, all levels. */
const logs = () => entries.map((entry) => entry.fields)

beforeEach(() => {
    sent = []
    turnstileCalls = []
    entries = []
})

afterEach(() => {
    vi.restoreAllMocks()
})

function makeLayer(scenario: Scenario) {
    return Layer.mergeAll(
        ContactConfig.layerTest({
            formTokenSecret: Option.some(Redacted.make(SECRET)),
            turnstileSecret: Option.some(Redacted.make('turnstile-secret')),
            resendApiKey: Option.some(Redacted.make('re_test')),
            ...scenario.config,
        }),
        Layer.succeed(Turnstile, {
            verify: (input) => Effect.sync(() => turnstileCalls.push(input)).pipe(Effect.andThen(scenario.turnstile ?? Effect.void)),
        }),
        RateLimiter.layerMemory,
        Layer.effect(
            BotIdVerifier,
            BotIdVerifier.make(() => Promise.resolve({ isBot: scenario.isBot ?? false, isVerifiedBot: false })),
        ),
        Layer.effect(
            EmailDomainVerifier,
            EmailDomainVerifier.make({
                isDisposable: () => scenario.disposable ?? false,
                resolveMx: scenario.mx ?? (() => Promise.resolve([{ exchange: 'mx.example.com' }])),
            }),
        ),
        Layer.succeed(Mailer, {
            send: (message) => Effect.sync(() => sent.push(message)).pipe(Effect.andThen(scenario.mailer ?? Effect.void)),
        }),
    ).pipe(Layer.provideMerge(ContactLog.layerMemory(entries)))
}

function validInput(overrides: Record<string, unknown> = {}) {
    return {
        name: 'Jan Novák',
        email: 'jan.novak@seznam.cz',
        phone: '+420 777 123 456',
        message: 'Ahoj, mám zájem o web, zavolejte mi.',
        subject: '',
        formToken: createFormToken(SECRET, Date.now() - 20_000).token,
        turnstileToken: 'turnstile-token',
        ...overrides,
    }
}

async function submit(input: unknown, scenario: Scenario = {}) {
    return Effect.runPromise(handleContactSubmission(input, REQUEST).pipe(Effect.provide(makeLayer(scenario))))
}

describe('contact pipeline', () => {
    it('sends a valid submission and binds Turnstile to the form token nonce', async () => {
        const input = validInput()

        await expect(submit(input)).resolves.toEqual({ status: 'success' })

        expect(sent).toHaveLength(1)
        expect(sent[0]).toMatchObject({ name: 'Jan Novák', email: 'jan.novak@seznam.cz', message: 'Ahoj, mám zájem o web, zavolejte mi.' })
        expect(turnstileCalls).toEqual([{ token: 'turnstile-token', remoteIp: '192.0.2.10', expectedCData: input.formToken.split('.')[1] }])
        expect(logs().at(-1)).toMatchObject({ event: 'contact_form', outcome: 'sent', ip: '192.0.2.10', hostname: 'localhost:4100' })
    })

    it('logs exactly one contact_form line per submission', async () => {
        await submit(validInput(), { mx: () => Promise.reject(Object.assign(new Error('t'), { code: 'ETIMEOUT' })) })
        await submit(validInput({ subject: 'filled' }))

        expect(logs().filter((fields) => fields.event === 'contact_form')).toHaveLength(2)
    })

    it('never logs the email address or the message body, on any level', async () => {
        await submit(validInput())
        await submit(validInput({ subject: 'filled' }))
        await submit(validInput(), {
            mailer: Effect.fail(new SendFailed({ cause: new Error('Invalid `to`: jan.novak@seznam.cz rejected (zavolejte)') })),
        })
        await submit(validInput(), { mx: () => Promise.reject(Object.assign(new Error('t'), { code: 'ETIMEOUT' })) })

        const serialized = JSON.stringify(entries)
        expect(entries.map((entry) => entry.level)).toEqual(expect.arrayContaining(['info', 'warn', 'error']))
        expect(serialized).not.toContain('jan.novak@seznam.cz')
        expect(logs()[0]).toHaveProperty('emailHash')
        expect(logs().find((fields) => fields.outcome === 'send_failed')).toMatchObject({
            error: { message: 'Invalid `to`: [email] rejected (zavolejte)' },
        })
    })

    it.each([
        ['missing fields', { message: undefined }],
        ['CR/LF in the name (header injection)', { name: 'Jan\r\nBcc: victim@example.com' }],
        ['line break in the email', { email: 'jan@example.com\nBcc: x@example.com' }],
        ['invalid phone', { phone: 'call me maybe' }],
        ['too short message', { message: 'Ahoj' }],
    ])('returns validation_error for %s without sending', async (_label, overrides) => {
        await expect(submit(validInput(overrides))).resolves.toEqual({ status: 'validation_error' })
        expect(sent).toHaveLength(0)
    })

    it('strips control and zero-width characters', async () => {
        await submit(validInput({ name: 'Jan\u0007 No​vák‮', message: 'Dobrý den,\r\nmám\u0000 zájem o web.' }))

        expect(sent[0].name).toBe('Jan Novák')
        expect(sent[0].message).toBe('Dobrý den,\nmám zájem o web.')
    })

    const silentDrops: Array<[string, unknown, Scenario]> = [
        ['a filled honeypot', validInput({ subject: 'Business offer' }), {}],
        [
            'a direct POST without tokens (old campaign payload)',
            {
                name: 'CiaDXxqkparbHyyth',
                email: 'ma.huz.e.wo.y.on0.8@gmail.com',
                phone: '2185848960',
                message: 'XHkXxGvjFZkZzlYmvX',
                botcheck: '',
            },
            {},
        ],
        ['a forged form token', validInput({ formToken: createFormToken('attacker-guess', Date.now() - 20_000).token }), {}],
        ['a form token used too fast', validInput({ formToken: createFormToken(SECRET, Date.now() - 500).token }), {}],
        ['an expired form token', validInput({ formToken: createFormToken(SECRET, Date.now() - 3 * 60 * 60 * 1_000).token }), {}],
        [
            'the known spam payload with valid tokens',
            validInput({ name: 'CiaDXxqkparbHyyth', email: 'ma.huz.e.wo.y.on0.8@gmail.com', message: 'XHkXxGvjFZkZzlYmvX' }),
            {},
        ],
        ['a BotID bot verdict', validInput(), { isBot: true }],
        ['a disposable email domain', validInput(), { disposable: true }],
        [
            'a domain without MX (NXDOMAIN)',
            validInput(),
            { mx: () => Promise.reject(Object.assign(new Error('nx'), { code: 'ENOTFOUND' })) },
        ],
        ['a null MX record', validInput(), { mx: () => Promise.resolve([{ exchange: '' }]) }],
    ]

    it.each(silentDrops)('silently drops %s (fake success, nothing sent)', async (_label, input, scenario) => {
        await expect(submit(input, scenario)).resolves.toEqual({ status: 'success' })
        expect(sent).toHaveLength(0)
        expect(logs().at(-1)).toMatchObject({ outcome: 'dropped' })
    })

    it('does not reach Turnstile for locally detected bots', async () => {
        await submit(validInput({ subject: 'x' }))
        await submit(validInput({ formToken: 'forged' }))
        await submit(validInput(), { isBot: true })

        expect(turnstileCalls).toHaveLength(0)
    })

    it('fails open when the MX lookup errors out or times out', async () => {
        await expect(
            submit(validInput(), { mx: () => Promise.reject(Object.assign(new Error('t'), { code: 'ETIMEOUT' })) }),
        ).resolves.toEqual({
            status: 'success',
        })
        await expect(submit(validInput(), { mx: () => new Promise(() => {}) })).resolves.toEqual({ status: 'success' })
        expect(sent).toHaveLength(2)
    }, 10_000)

    it('maps Turnstile failures to a generic verification_error', async () => {
        await expect(
            submit(validInput(), { turnstile: Effect.fail(new TurnstileFailed({ codes: ['hostname-mismatch'] })) }),
        ).resolves.toEqual({
            status: 'verification_error',
        })
        expect(sent).toHaveLength(0)
        expect(logs().at(-1)).toMatchObject({ outcome: 'rejected', reason: 'turnstile', codes: ['hostname-mismatch'] })
    })

    it('rate limits per IP', async () => {
        const layer = makeLayer({})
        const results = await Effect.runPromise(
            Effect.forEach([1, 2, 3, 4], (i) => handleContactSubmission(validInput({ email: `user${i}@example.com` }), REQUEST)).pipe(
                Effect.provide(layer),
            ),
        )

        expect(results.map((result) => result.status)).toEqual(['success', 'success', 'success', 'rate_limited'])
        expect(sent).toHaveLength(3)
    })

    it('returns configuration_error when secrets are missing', async () => {
        await expect(submit(validInput(), { config: { formTokenSecret: Option.none() } })).resolves.toEqual({
            status: 'configuration_error',
        })
        await expect(submit(validInput(), { config: { turnstileSecret: Option.none() } })).resolves.toEqual({
            status: 'configuration_error',
        })
        await expect(submit(validInput(), { config: { resendApiKey: Option.none() } })).resolves.toEqual({ status: 'configuration_error' })
        expect(sent).toHaveLength(0)
    })

    it('does not require the Resend key in dry-run mode', async () => {
        await expect(submit(validInput(), { config: { resendApiKey: Option.none(), dryRun: true } })).resolves.toEqual({
            status: 'success',
        })
        expect(logs().at(-1)).toMatchObject({ outcome: 'accepted_dry_run' })
    })

    it('refuses a dry run in production instead of silently dropping real enquiries', async () => {
        await expect(submit(validInput(), { config: { dryRun: true, isProduction: true } })).resolves.toEqual({
            status: 'configuration_error',
        })
        expect(sent).toHaveLength(0)
    })

    it('maps send failures to send_error', async () => {
        await expect(submit(validInput(), { mailer: Effect.fail(new SendFailed({ cause: new Error('resend down') })) })).resolves.toEqual({
            status: 'send_error',
        })
    })
})

describe('resolveClientIp', () => {
    const request = { realIp: '203.0.113.5', forwardedFor: '198.51.100.1, 10.0.0.1', socketIp: '10.0.0.2', host: undefined }

    it('trusts proxy headers only on Vercel', () => {
        expect(resolveClientIp(request, true)).toBe('203.0.113.5')
        expect(resolveClientIp({ ...request, realIp: undefined }, true)).toBe('198.51.100.1')
        expect(resolveClientIp(request, false)).toBe('10.0.0.2')
    })
})
