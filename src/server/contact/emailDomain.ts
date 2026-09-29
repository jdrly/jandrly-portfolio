import { Clock, Context, Effect, Layer } from 'effect'
import { splitEmail } from './checks'
import { SpamContent } from './errors'
import { ContactLog } from './log'

type MxLookupResult = 'ok' | 'no_mx' | 'unknown'

const MX_TIMEOUT = '2 seconds'
const CACHE_TTL_MS = 60 * 60 * 1_000
const CACHE_MAX_ENTRIES = 1_000
/** Answers that prove the domain cannot receive mail. Everything else (timeouts, SERVFAIL, ...) fails open. */
const NO_MAIL_CODES = new Set(['ENOTFOUND', 'ENODATA'])

/** Classifies a `resolveMx` outcome. A "null MX" (RFC 7505, single `.` exchange) means "no mail". */
function classifyMxRecords(records: ReadonlyArray<{ exchange: string }>): MxLookupResult {
    const usable = records.filter((record) => record.exchange !== '' && record.exchange !== '.')

    return usable.length > 0 ? 'ok' : 'no_mx'
}

function classifyMxError(error: unknown): MxLookupResult {
    const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : ''

    return NO_MAIL_CODES.has(code) ? 'no_mx' : 'unknown'
}

export class EmailDomainVerifier extends Context.Service<
    EmailDomainVerifier,
    {
        verify: (email: string) => Effect.Effect<void, SpamContent>
    }
>()('jandrly/server/contact/EmailDomainVerifier') {
    static readonly make = (options: {
        isDisposable: (domain: string) => boolean
        resolveMx: (domain: string) => Promise<ReadonlyArray<{ exchange: string }>>
    }) =>
        Effect.gen(function* () {
            const log = yield* ContactLog
            const cache = new Map<string, { result: MxLookupResult; expiresAt: number }>()

            const lookupMx = (domain: string) =>
                Effect.tryPromise({ try: () => options.resolveMx(domain), catch: (error) => error }).pipe(
                    Effect.map(classifyMxRecords),
                    Effect.catch((error) => Effect.succeed(classifyMxError(error))),
                    // DNS is slow or down: fail open.
                    Effect.timeoutOrElse({ duration: MX_TIMEOUT, orElse: () => Effect.succeed<MxLookupResult>('unknown') }),
                )

            const verify = Effect.fn('EmailDomainVerifier.verify')(function* (email: string) {
                const { domain } = splitEmail(email)

                if (options.isDisposable(domain)) {
                    return yield* new SpamContent({ rule: 'disposable_email' })
                }

                const now = yield* Clock.currentTimeMillis
                const cached = cache.get(domain)
                let result: MxLookupResult

                if (cached && cached.expiresAt > now) {
                    result = cached.result
                } else {
                    result = yield* lookupMx(domain)

                    if (result !== 'unknown') {
                        if (cache.size >= CACHE_MAX_ENTRIES) cache.clear()
                        cache.set(domain, { result, expiresAt: now + CACHE_TTL_MS })
                    } else {
                        yield* log.record({ event: 'contact_mx_lookup_inconclusive', domain })
                    }
                }

                if (result === 'no_mx') {
                    return yield* new SpamContent({ rule: 'no_mx' })
                }
            })

            return EmailDomainVerifier.of({ verify })
        })

    static readonly layer = Layer.effect(
        EmailDomainVerifier,
        Effect.gen(function* () {
            const [{ isDisposableEmailDomain }, { resolveMx }] = yield* Effect.promise(() =>
                Promise.all([import('disposable-email-domains-js'), import('node:dns/promises')]),
            )

            return yield* EmailDomainVerifier.make({ isDisposable: isDisposableEmailDomain, resolveMx })
        }),
    )

    static readonly layerNoop = Layer.succeed(EmailDomainVerifier, EmailDomainVerifier.of({ verify: () => Effect.void }))
}
