// @vitest-environment node
import { Effect, Layer, Option, Redacted } from 'effect'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ContactConfig } from './config'
import { ContactLog } from './log'
import { MAX_CHALLENGE_AGE_MS, Turnstile, evaluateSiteverify } from './turnstile'
import type { ContactSettings } from './config'
import type { LogEntry } from './log'
import type { TurnstileVerifyInput } from './turnstile'

const NONCE = 'AAAAAAAAAAAAAAAAAAAAAA'
const INPUT: TurnstileVerifyInput = { token: 'client-token', remoteIp: '203.0.113.7', expectedCData: NONCE }
const REAL_SECRET = '0x4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
const DUMMY_SECRET = '1x0000000000000000000000000000000AA'

afterEach(() => {
    vi.restoreAllMocks()
})

function siteverifyResponse(overrides: Record<string, unknown> = {}) {
    return new Response(
        JSON.stringify({
            success: true,
            challenge_ts: new Date(Date.now() - 10_000).toISOString(),
            hostname: 'www.jandrly.cz',
            action: 'contact',
            cdata: NONCE,
            'error-codes': [],
            ...overrides,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
}

function verify(config: Partial<ContactSettings>, input: TurnstileVerifyInput = INPUT, logEntries: Array<LogEntry> = []) {
    const layer = Turnstile.layer.pipe(
        Layer.provide(ContactLog.layerMemory(logEntries)),
        Layer.provide(
            ContactConfig.layerTest({
                turnstileSecret: Option.some(Redacted.make(REAL_SECRET)),
                allowedHostnames: ['jandrly.cz', 'www.jandrly.cz'],
                isProduction: true,
                ...config,
            }),
        ),
    )

    return Effect.runPromise(
        Turnstile.use((turnstile) => turnstile.verify(input)).pipe(
            Effect.match({
                onSuccess: () => ({ ok: true as const }),
                onFailure: (error) => ({ ok: false as const, tag: error._tag, codes: error._tag === 'TurnstileFailed' ? error.codes : [] }),
            }),
            Effect.provide(layer),
        ),
    )
}

describe('Turnstile.verify', () => {
    it('accepts a fresh contact challenge from an allowed hostname and sends strict siteverify params', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(siteverifyResponse())

        await expect(verify({})).resolves.toEqual({ ok: true })

        const body = fetchMock.mock.calls[0][1]?.body as URLSearchParams
        expect(body.get('secret')).toBe(REAL_SECRET)
        expect(body.get('response')).toBe('client-token')
        expect(body.get('remoteip')).toBe('203.0.113.7')
        expect(body.get('idempotency_key')).toMatch(/^[0-9a-f-]{36}$/)
    })

    it('rejects a hostname that is not allowlisted', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(siteverifyResponse({ hostname: 'evil.example' }))

        await expect(verify({})).resolves.toMatchObject({ ok: false, codes: ['hostname-mismatch'] })
    })

    it('rejects a stale challenge_ts', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            siteverifyResponse({ challenge_ts: new Date(Date.now() - MAX_CHALLENGE_AGE_MS - 1_000).toISOString() }),
        )

        await expect(verify({})).resolves.toMatchObject({ ok: false, codes: ['stale-challenge'] })
    })

    it('rejects a different action or cdata', async () => {
        vi.spyOn(globalThis, 'fetch')
            .mockResolvedValueOnce(siteverifyResponse({ action: 'newsletter' }))
            .mockResolvedValueOnce(siteverifyResponse({ cdata: 'other' }))

        await expect(verify({})).resolves.toMatchObject({ ok: false, codes: ['action-mismatch'] })
        await expect(verify({})).resolves.toMatchObject({ ok: false, codes: ['cdata-mismatch'] })
    })

    it('passes Cloudflare error codes through for logging', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(siteverifyResponse({ success: false, 'error-codes': ['timeout-or-duplicate'] }))
        const entries: Array<LogEntry> = []

        await expect(verify({}, INPUT, entries)).resolves.toMatchObject({ ok: false, codes: ['timeout-or-duplicate'] })
        expect(entries).toEqual([{ level: 'warn', fields: { event: 'contact_turnstile', codes: ['timeout-or-duplicate'] } }])
    })

    it('accepts the dummy test secret outside production (dummy responses have action "test")', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(siteverifyResponse({ hostname: 'example.com', action: 'test', cdata: 'test-data' }))

        await expect(verify({ isProduction: false, turnstileSecret: Option.some(Redacted.make(DUMMY_SECRET)) })).resolves.toEqual({
            ok: true,
        })
    })

    it('refuses the dummy test secret in production without calling Cloudflare', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch')

        await expect(verify({ isProduction: true, turnstileSecret: Option.some(Redacted.make(DUMMY_SECRET)) })).resolves.toMatchObject({
            ok: false,
            tag: 'ConfigurationError',
        })
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('fails with a configuration error when the secret is missing', async () => {
        await expect(verify({ turnstileSecret: Option.none() })).resolves.toMatchObject({ ok: false, tag: 'ConfigurationError' })
    })

    it('retries once and then fails on network errors', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('fetch failed'))

        await expect(verify({})).resolves.toMatchObject({ ok: false, codes: ['network-error'] })
        expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    it('recovers when the retry succeeds after a 5xx', async () => {
        vi.spyOn(globalThis, 'fetch')
            .mockResolvedValueOnce(new Response('oops', { status: 502 }))
            .mockResolvedValueOnce(siteverifyResponse())

        await expect(verify({})).resolves.toEqual({ ok: true })
    })
})

describe('evaluateSiteverify', () => {
    const now = Date.parse('2026-09-28T12:00:00Z')
    const base = {
        success: true,
        challenge_ts: '2026-09-28T11:59:00Z',
        hostname: 'jandrly.cz',
        action: 'contact',
        cdata: NONCE,
    }
    const expectations = { now, allowedHostnames: ['jandrly.cz'], expectedCData: NONCE, dummy: false }

    it('collects every failed check', () => {
        expect(evaluateSiteverify(base, expectations)).toEqual([])
        expect(
            evaluateSiteverify(
                { ...base, hostname: undefined, action: undefined, challenge_ts: undefined, cdata: undefined },
                expectations,
            ),
        ).toEqual(['action-mismatch', 'hostname-mismatch', 'missing-challenge-ts', 'cdata-mismatch'])
    })

    it('only checks success for dummy responses', () => {
        expect(evaluateSiteverify({ success: true, hostname: 'localhost', action: 'test' }, { ...expectations, dummy: true })).toEqual([])
        expect(evaluateSiteverify({ success: false }, { ...expectations, dummy: true })).toEqual(['unsuccessful'])
    })
})
