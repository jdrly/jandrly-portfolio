import { Clock, Context, Effect, Layer, Option, Redacted } from 'effect'
import { ContactConfig } from './config'
import { RateLimited } from './errors'
import { ContactLog, fingerprint } from './log'

export interface RateLimitRule {
    readonly limit: number
    readonly windowMs: number
}

/** 3 submissions per hour per IP, 2 per day per (normalized) email address. */
export const IP_RULE: RateLimitRule = { limit: 3, windowMs: 60 * 60 * 1_000 }
export const EMAIL_RULE: RateLimitRule = { limit: 2, windowMs: 24 * 60 * 60 * 1_000 }

export interface RateLimitKeys {
    readonly ip: string | undefined
    /** Already normalized with `normalizeEmailForRateLimit`. */
    readonly email: string
}

/**
 * Minimal in-memory sliding-window log. On serverless each instance has its own
 * memory, so this is best effort only — configure Upstash for a shared limit.
 */
export function createMemoryWindow(maxKeys = 5_000) {
    const hits = new Map<string, Array<number>>()

    return {
        /** Records a hit and returns whether it is within the limit. */
        hit(key: string, rule: RateLimitRule, now: number) {
            const recent = (hits.get(key) ?? []).filter((timestamp) => now - timestamp < rule.windowMs)

            if (recent.length >= rule.limit) {
                hits.set(key, recent)
                return false
            }

            recent.push(now)
            hits.delete(key)
            hits.set(key, recent)

            // Map preserves insertion order: evict the least recently used keys.
            while (hits.size > maxKeys) {
                const oldest = hits.keys().next().value
                if (oldest === undefined) break
                hits.delete(oldest)
            }

            return true
        },
        size: () => hits.size,
    }
}

export class RateLimiter extends Context.Service<
    RateLimiter,
    {
        check: (keys: RateLimitKeys) => Effect.Effect<void, RateLimited>
    }
>()('jandrly/server/contact/RateLimiter') {
    static readonly layerMemory = Layer.sync(RateLimiter, () => {
        const window = createMemoryWindow()

        const check = Effect.fn('RateLimiter.check')(function* (keys: RateLimitKeys) {
            const now = yield* Clock.currentTimeMillis

            if (keys.ip && !window.hit(`ip:${keys.ip}`, IP_RULE, now)) {
                return yield* new RateLimited({ scope: 'ip' })
            }

            if (!window.hit(`email:${fingerprint(keys.email)}`, EMAIL_RULE, now)) {
                return yield* new RateLimited({ scope: 'email' })
            }
        })

        return RateLimiter.of({ check })
    })

    static readonly layerUpstash = (url: string, token: Redacted.Redacted<string>) =>
        Layer.effect(
            RateLimiter,
            Effect.gen(function* () {
                const log = yield* ContactLog
                const [{ Ratelimit }, { Redis }] = yield* Effect.promise(() =>
                    Promise.all([import('@upstash/ratelimit'), import('@upstash/redis')]),
                )
                const redis = new Redis({ url, token: Redacted.value(token) })
                // `timeout`: if Upstash does not answer within 2 s the request is allowed (fail open).
                const ipLimiter = new Ratelimit({
                    redis,
                    prefix: 'contact:ip',
                    limiter: Ratelimit.slidingWindow(IP_RULE.limit, '1 h'),
                    timeout: 2_000,
                    analytics: false,
                })
                const emailLimiter = new Ratelimit({
                    redis,
                    prefix: 'contact:email',
                    limiter: Ratelimit.slidingWindow(EMAIL_RULE.limit, '1 d'),
                    timeout: 2_000,
                    analytics: false,
                })

                const limit = (limiter: typeof ipLimiter, key: string) =>
                    Effect.tryPromise(() => limiter.limit(key)).pipe(
                        Effect.map((result) => result.success),
                        // Redis outage must not take the contact form down: fail open and log.
                        Effect.catch((error) => log.record({ event: 'contact_rate_limit_error', error }).pipe(Effect.as(true))),
                    )

                const check = Effect.fn('RateLimiter.check')(function* (keys: RateLimitKeys) {
                    if (keys.ip && !(yield* limit(ipLimiter, keys.ip))) {
                        return yield* new RateLimited({ scope: 'ip' })
                    }

                    // Never store plain email addresses in Redis.
                    if (!(yield* limit(emailLimiter, fingerprint(keys.email)))) {
                        return yield* new RateLimited({ scope: 'email' })
                    }
                })

                return RateLimiter.of({ check })
            }),
        )

    /** Upstash when `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` are set, in-memory otherwise. */
    static readonly layer = Layer.unwrap(
        Effect.gen(function* () {
            const config = yield* ContactConfig

            return Option.match(config.upstash, {
                onNone: () => RateLimiter.layerMemory,
                onSome: ({ url, token }) => RateLimiter.layerUpstash(url, token),
            })
        }),
    )

    static readonly layerNoop = Layer.succeed(RateLimiter, RateLimiter.of({ check: () => Effect.void }))
}
