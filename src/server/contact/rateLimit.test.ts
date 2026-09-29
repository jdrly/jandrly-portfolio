// @vitest-environment node
import { Effect } from 'effect'
import { describe, expect, it } from 'vitest'
import { EMAIL_RULE, IP_RULE, RateLimiter, createMemoryWindow } from './rateLimit'

describe('createMemoryWindow', () => {
    it('allows up to the limit within the window and slides', () => {
        const window = createMemoryWindow()
        const rule = { limit: 3, windowMs: 1_000 }

        expect([0, 100, 200, 300].map((t) => window.hit('k', rule, t))).toEqual([true, true, true, false])
        // The first hit (t=0) leaves the window at t=1000.
        expect(window.hit('k', rule, 1_000)).toBe(true)
        expect(window.hit('k', rule, 1_001)).toBe(false)
        expect(window.hit('other', rule, 1_001)).toBe(true)
    })

    it('evicts least recently used keys beyond the cap', () => {
        const window = createMemoryWindow(2)
        const rule = { limit: 1, windowMs: 1_000 }

        window.hit('a', rule, 0)
        window.hit('b', rule, 0)
        window.hit('c', rule, 0)

        expect(window.size()).toBe(2)
        expect(window.hit('a', rule, 1)).toBe(true)
    })
})

describe('RateLimiter.layerMemory', () => {
    const run = <TValue, TError>(effect: Effect.Effect<TValue, TError, RateLimiter>) =>
        Effect.runPromise(Effect.provide(effect, RateLimiter.layerMemory))

    const attempt = (ip: string | undefined, email: string) =>
        RateLimiter.use((limiter) => limiter.check({ ip, email })).pipe(
            Effect.match({ onSuccess: () => 'ok', onFailure: (error) => `limited:${error.scope}` }),
        )

    it(`limits to ${IP_RULE.limit} per IP`, async () => {
        const results = await run(Effect.forEach([1, 2, 3, 4], (i) => attempt('198.51.100.1', `user${i}@example.com`)))

        expect(results).toEqual(['ok', 'ok', 'ok', 'limited:ip'])
    })

    it(`limits to ${EMAIL_RULE.limit} per email across IPs`, async () => {
        const results = await run(Effect.forEach(['10.0.0.1', '10.0.0.2', '10.0.0.3'], (ip) => attempt(ip, 'jan@example.com')))

        expect(results).toEqual(['ok', 'ok', 'limited:email'])
    })

    it('still limits by email when the IP is unknown', async () => {
        const results = await run(Effect.forEach([1, 2, 3], () => attempt(undefined, 'jan@example.com')))

        expect(results).toEqual(['ok', 'ok', 'limited:email'])
    })
})
