// @vitest-environment node
import { ConfigProvider, Effect, Layer, Option, Redacted } from 'effect'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BotIdVerifier } from './botId'
import { ContactConfig } from './config'
import { Mailer } from './email'
import { EmailDomainVerifier } from './emailDomain'
import { ContactLog } from './log'
import { createFormToken } from './formToken'
import { RateLimiter } from './rateLimit'
import { makeContactRunner } from './runner'
import { Turnstile } from './turnstile'
import type { ContactServices } from './runner'

const SECRET = 'form-token-secret-for-tests'
const REQUEST = { realIp: undefined, forwardedFor: undefined, socketIp: '192.0.2.10', host: 'localhost' }

beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
    vi.restoreAllMocks()
})

const workingConfig = ContactConfig.layerTest({
    formTokenSecret: Option.some(Redacted.make(SECRET)),
    turnstileSecret: Option.some(Redacted.make('turnstile-secret')),
    resendApiKey: Option.some(Redacted.make('re_test')),
})

function services<TError>(
    mailer: Mailer['Service'],
    config: Layer.Layer<ContactConfig, TError> = workingConfig,
): Layer.Layer<ContactServices, TError> {
    return Layer.mergeAll(
        config,
        Layer.succeed(Turnstile, { verify: () => Effect.void }),
        RateLimiter.layerMemory,
        BotIdVerifier.layerNoop,
        EmailDomainVerifier.layerNoop,
        Layer.succeed(Mailer, mailer),
        ContactLog.layerMemory([]),
    )
}

const validInput = () => ({
    name: 'Jan Novák',
    email: 'jan.novak@seznam.cz',
    message: 'Ahoj, mám zájem o web, zavolejte mi.',
    formToken: createFormToken(SECRET, Date.now() - 20_000).token,
    turnstileToken: 'turnstile-token',
})

describe('contact runner', () => {
    it('runs the pipeline', async () => {
        const runner = makeContactRunner(services({ send: () => Effect.void }))

        await expect(runner.submit(validInput(), REQUEST)).resolves.toEqual({ status: 'success' })
        await expect(runner.issueFormToken()).resolves.toMatchObject({ status: 'ok' })
    })

    it.each([
        [
            'an invalid environment value',
            ContactConfig.layerNoDotEnv.pipe(Layer.provide(ConfigProvider.layer(ConfigProvider.fromUnknown({ CONTACT_DRY_RUN: 'maybe' })))),
        ],
        ['a module that fails to load', Layer.effect(ContactConfig, Effect.die(new Error('Cannot find module')))],
    ])('answers configuration_error when the services cannot start (%s)', async (_label, brokenConfig) => {
        const runner = makeContactRunner(services({ send: () => Effect.void }, brokenConfig))

        await expect(runner.submit(validInput(), REQUEST)).resolves.toEqual({ status: 'configuration_error' })
        await expect(runner.issueFormToken()).resolves.toEqual({ status: 'configuration_error' })
    })

    it('answers send_error when the pipeline crashes unexpectedly', async () => {
        const runner = makeContactRunner(services({ send: () => Effect.die(new Error('boom')) }))

        await expect(runner.submit(validInput(), REQUEST)).resolves.toEqual({ status: 'send_error' })
    })
})
