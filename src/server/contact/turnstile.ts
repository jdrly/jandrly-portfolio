import { Clock, Context, Data, Effect, Layer, Redacted } from 'effect'
import { z } from 'zod'
import { ContactConfig } from './config'
import { TurnstileFailed } from './errors'
import { ContactLog } from './log'
import { TURNSTILE_ACTION } from './rules'
import type { ConfigurationError } from './errors'

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
/** Tokens are valid for 300 s; reject anything older even if Cloudflare still accepts it. */
export const MAX_CHALLENGE_AGE_MS = 300_000
const MAX_CHALLENGE_FUTURE_SKEW_MS = 60_000
const VERIFY_TIMEOUT = '5 seconds'

const siteverifyResponseSchema = z.object({
    success: z.boolean(),
    'error-codes': z.array(z.string()).optional(),
    challenge_ts: z.string().optional(),
    hostname: z.string().optional(),
    action: z.string().optional(),
    cdata: z.string().optional(),
})

export type SiteverifyResponse = z.infer<typeof siteverifyResponseSchema>

export interface SiteverifyExpectations {
    now: number
    allowedHostnames: ReadonlyArray<string>
    expectedCData: string
    /** Cloudflare test secret (development only, see `ContactConfig`): only `success` is checked. */
    dummy: boolean
}

/** Pure evaluation of a siteverify response. Returns the list of failure codes (empty = valid). */
export function evaluateSiteverify(response: SiteverifyResponse, expectations: SiteverifyExpectations): Array<string> {
    if (!response.success) {
        const codes = response['error-codes'] ?? []
        return codes.length > 0 ? codes : ['unsuccessful']
    }

    if (expectations.dummy) {
        return []
    }

    const codes: Array<string> = []

    if (response.action !== TURNSTILE_ACTION) {
        codes.push('action-mismatch')
    }

    if (!response.hostname || !expectations.allowedHostnames.includes(response.hostname.toLowerCase())) {
        codes.push('hostname-mismatch')
    }

    const challengeAt = response.challenge_ts ? Date.parse(response.challenge_ts) : Number.NaN

    if (Number.isNaN(challengeAt)) {
        codes.push('missing-challenge-ts')
    } else if (expectations.now - challengeAt > MAX_CHALLENGE_AGE_MS) {
        codes.push('stale-challenge')
    } else if (challengeAt - expectations.now > MAX_CHALLENGE_FUTURE_SKEW_MS) {
        codes.push('challenge-in-future')
    }

    if (response.cdata !== expectations.expectedCData) {
        codes.push('cdata-mismatch')
    }

    return codes
}

export interface TurnstileVerifyInput {
    token: string
    remoteIp: string | undefined
    expectedCData: string
}

class SiteverifyUnavailable extends Data.TaggedError('SiteverifyUnavailable')<{ readonly code: string }> {}

export class Turnstile extends Context.Service<
    Turnstile,
    {
        verify: (input: TurnstileVerifyInput) => Effect.Effect<void, TurnstileFailed | ConfigurationError>
    }
>()('jandrly/server/contact/Turnstile') {
    static readonly layer = Layer.effect(
        Turnstile,
        Effect.gen(function* () {
            const config = yield* ContactConfig
            const log = yield* ContactLog

            const verify = Effect.fn('Turnstile.verify')(
                function* (input: TurnstileVerifyInput) {
                    const credentials = yield* config.turnstile
                    const secret = Redacted.value(credentials.secret)

                    // One idempotency key per verification lets us retry transient failures
                    // without Cloudflare rejecting the retry as a duplicate token.
                    const body = new URLSearchParams({ secret, response: input.token, idempotency_key: crypto.randomUUID() })

                    if (input.remoteIp) {
                        body.set('remoteip', input.remoteIp)
                    }

                    const request = Effect.tryPromise({
                        try: async (signal) => {
                            const response = await fetch(TURNSTILE_VERIFY_URL, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                                body,
                                signal,
                            })

                            if (response.status >= 500) {
                                throw new SiteverifyUnavailable({ code: `http-${response.status}` })
                            }

                            if (!response.ok) {
                                return { status: response.status, json: null as unknown }
                            }

                            return { status: response.status, json: (await response.json()) as unknown }
                        },
                        catch: (cause) =>
                            cause instanceof SiteverifyUnavailable ? cause : new SiteverifyUnavailable({ code: 'network-error' }),
                    }).pipe(
                        Effect.timeoutOrElse({
                            duration: VERIFY_TIMEOUT,
                            orElse: () => Effect.fail(new SiteverifyUnavailable({ code: 'timeout' })),
                        }),
                        Effect.retry({ times: 1 }),
                        Effect.mapError((unavailable) => new TurnstileFailed({ codes: [unavailable.code] })),
                    )

                    const { status, json } = yield* request

                    if (json === null) {
                        return yield* new TurnstileFailed({ codes: [`http-${status}`] })
                    }

                    const parsed = siteverifyResponseSchema.safeParse(json)

                    if (!parsed.success) {
                        return yield* new TurnstileFailed({ codes: ['invalid-response'] })
                    }

                    const now = yield* Clock.currentTimeMillis
                    const codes = evaluateSiteverify(parsed.data, {
                        now,
                        allowedHostnames: config.allowedHostnames,
                        expectedCData: input.expectedCData,
                        dummy: credentials.isTestSecret,
                    })

                    if (codes.length > 0) {
                        return yield* new TurnstileFailed({ codes })
                    }
                },
                Effect.tapError((error) =>
                    error._tag === 'TurnstileFailed' ? log.record({ event: 'contact_turnstile', codes: error.codes }) : Effect.void,
                ),
            )

            return Turnstile.of({ verify })
        }),
    )
}
