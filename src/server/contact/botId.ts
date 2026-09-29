import { Context, Effect, Layer } from 'effect'
import { ContactConfig } from './config'
import { BotDetected } from './errors'
import { ContactLog } from './log'

export interface BotIdVerdict {
    isBot: boolean
    isVerifiedBot: boolean
}

/**
 * Vercel BotID. Only active on Vercel (`VERCEL=1`); locally and in tests it is a
 * no-op. Errors (e.g. OIDC not enabled, API outage) fail open and are logged —
 * BotID is one layer among several and must never block real visitors by itself.
 */
export class BotIdVerifier extends Context.Service<
    BotIdVerifier,
    {
        readonly verify: Effect.Effect<void, BotDetected>
    }
>()('jandrly/server/contact/BotIdVerifier') {
    static readonly make = Effect.fnUntraced(function* (check: () => Promise<BotIdVerdict>) {
        const log = yield* ContactLog

        return BotIdVerifier.of({
            verify: Effect.tryPromise(check).pipe(
                Effect.catch((error) =>
                    log
                        .record({ event: 'contact_botid_error', error })
                        .pipe(Effect.as<BotIdVerdict>({ isBot: false, isVerifiedBot: false })),
                ),
                Effect.flatMap((verdict) =>
                    verdict.isBot
                        ? Effect.fail(new BotDetected({ reason: verdict.isVerifiedBot ? 'botid_verified_bot' : 'botid' }))
                        : Effect.void,
                ),
                Effect.withSpan('BotIdVerifier.verify'),
            ),
        })
    })

    static readonly layer = Layer.unwrap(
        Effect.gen(function* () {
            const config = yield* ContactConfig

            if (!config.onVercel) {
                return BotIdVerifier.layerNoop
            }

            return Layer.effect(
                BotIdVerifier,
                BotIdVerifier.make(async () => {
                    const { checkBotId } = await import('botid/server')
                    return checkBotId()
                }),
            )
        }),
    )

    static readonly layerNoop = Layer.succeed(BotIdVerifier, BotIdVerifier.of({ verify: Effect.void }))
}
