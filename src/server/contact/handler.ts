import { Clock, Effect, Predicate, Redacted } from 'effect'
import { BotIdVerifier } from './botId'
import { classifyContent, isHoneypotFilled, normalizeEmailForRateLimit } from './checks'
import { ContactConfig } from './config'
import { Mailer } from './email'
import { EmailDomainVerifier } from './emailDomain'
import { BotDetected, SpamContent, ValidationError } from './errors'
import { createFormToken, verifyFormToken } from './formToken'
import { ContactLog } from './log'
import { RateLimiter } from './rateLimit'
import { HONEYPOT_FIELD } from './rules'
import { contactSubmissionSchema } from './schema'
import { Turnstile } from './turnstile'
import type { ContactEvent } from './log'
import type { ContactResponse, ContactStatus, FormTokenResponse } from './types'

/** Raw request facts collected at the edge (see `runtime.ts`). */
export interface ContactRequestContext {
    /** `x-real-ip` header (set by Vercel). */
    realIp: string | undefined
    /** `x-forwarded-for` header. */
    forwardedFor: string | undefined
    /** Socket address as seen by the server. */
    socketIp: string | undefined
    /** `host` header. */
    host: string | undefined
}

/** Proxy headers are only trusted on Vercel, which overwrites them; locally they are client-controlled. */
export function resolveClientIp(request: ContactRequestContext, trustProxyHeaders: boolean) {
    if (trustProxyHeaders) {
        const forwarded = request.forwardedFor?.split(',')[0]?.trim()
        return request.realIp?.trim() || forwarded || request.socketIp
    }

    return request.socketIp
}

/**
 * The contact pipeline. Cheap local checks run first; network checks
 * (BotID, Turnstile, DNS) only run for submissions that survived them.
 *
 * Succeeds with how the message was delivered.
 *
 *   validate → config → honeypot → form token → content → rate limit → BotID → Turnstile → email domain → send
 */
const processContactSubmission = Effect.fn('processContactSubmission')(function* (input: unknown, ip: string | undefined) {
    const config = yield* ContactConfig

    // 1. Schema validation and sanitization.
    const parsed = contactSubmissionSchema.safeParse(input)

    if (!parsed.success) {
        // The real form never submits without both tokens, so a payload missing them
        // is a direct POST: answer like a success instead of revealing the schema.
        const missingTokens = parsed.error.issues.some((issue) => issue.path[0] === 'formToken' || issue.path[0] === 'turnstileToken')

        if (missingTokens) {
            return yield* new BotDetected({ reason: 'missing_tokens' })
        }

        return yield* new ValidationError({ issues: parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.code}`) })
    }

    const data = parsed.data

    // Fail fast when this environment cannot process submissions at all.
    const operational = yield* config.operational
    const formTokenSecret = Redacted.value(operational.formTokenSecret)

    // 2. Honeypot.
    if (isHoneypotFilled(data[HONEYPOT_FIELD])) {
        return yield* new BotDetected({ reason: 'honeypot' })
    }

    // 3. Signed form token, timed purely on the server clock.
    const now = yield* Clock.currentTimeMillis
    const formToken = verifyFormToken(data.formToken, formTokenSecret, now)

    if (!formToken.ok) {
        return yield* new BotDetected({ reason: `form_token_${formToken.reason}` })
    }

    // 4. Content classifier.
    const spamRule = classifyContent(data)

    if (spamRule) {
        return yield* new SpamContent({ rule: spamRule })
    }

    // 5. Rate limiting (per IP and per normalized email).
    const rateLimiter = yield* RateLimiter
    yield* rateLimiter.check({ ip, email: normalizeEmailForRateLimit(data.email) })

    // 6. Vercel BotID.
    const botId = yield* BotIdVerifier
    yield* botId.verify

    // 7. Strict Turnstile siteverify, bound to this form token via cData.
    const turnstile = yield* Turnstile
    yield* turnstile.verify({ token: data.turnstileToken, remoteIp: ip, expectedCData: formToken.nonce })

    // 8. Disposable domain + MX lookup.
    const emailDomain = yield* EmailDomainVerifier
    yield* emailDomain.verify(data.email)

    // 9. Send.
    const mailer = yield* Mailer
    yield* mailer.send({ name: data.name, email: data.email, phone: data.phone, message: data.message, nonce: formToken.nonce })

    return operational.delivery._tag
})

function rawEmail(input: unknown) {
    return Predicate.isObject(input) && 'email' in input && Predicate.isString(input.email) ? input.email : undefined
}

type SubmissionRecord = Omit<Extract<ContactEvent, { event: 'contact_form' }>, 'event'>

/**
 * Runs the pipeline and maps every outcome to a client response and exactly one
 * `contact_form` log record. Bot and spam verdicts are answered with a fake
 * `success` so attackers learn nothing.
 */
export const handleContactSubmission = Effect.fn('handleContactSubmission')(function* (input: unknown, request: ContactRequestContext) {
    const config = yield* ContactConfig
    const log = yield* ContactLog
    const ip = resolveClientIp(request, config.onVercel)
    const base = { ip: ip ?? 'unknown', hostname: request.host, email: rawEmail(input) }

    const answer = (status: ContactStatus, record: SubmissionRecord) =>
        log.record({ event: 'contact_form', ...base, ...record }).pipe(Effect.as<ContactResponse>({ status }))

    return yield* processContactSubmission(input, ip).pipe(
        Effect.flatMap((delivery) => answer('success', { outcome: delivery === 'DryRun' ? 'accepted_dry_run' : 'sent' })),
        Effect.catchTags({
            ValidationError: (error) =>
                answer('validation_error', { outcome: 'rejected', reason: 'validation', issues: error.issues.slice(0, 5) }),
            BotDetected: (error) => answer('success', { outcome: 'dropped', reason: `bot:${error.reason}` }),
            SpamContent: (error) => answer('success', { outcome: 'dropped', reason: `spam:${error.rule}` }),
            RateLimited: (error) => answer('rate_limited', { outcome: 'rate_limited', reason: `rate_limit:${error.scope}` }),
            TurnstileFailed: (error) => answer('verification_error', { outcome: 'rejected', reason: 'turnstile', codes: error.codes }),
            ConfigurationError: (error) => answer('configuration_error', { outcome: 'configuration_error', message: error.message }),
            SendFailed: (error) => answer('send_error', { outcome: 'send_failed', error: error.cause }),
        }),
    )
})

export const issueFormToken = Effect.gen(function* () {
    const config = yield* ContactConfig
    const secret = yield* config.formTokenSecret
    const now = yield* Clock.currentTimeMillis
    const { token, nonce } = createFormToken(Redacted.value(secret), now)

    return { status: 'ok', token, nonce } satisfies FormTokenResponse
}).pipe(
    Effect.catchTag('ConfigurationError', (error) =>
        ContactLog.use((log) => log.record({ event: 'contact_form', outcome: 'configuration_error', message: error.message })).pipe(
            Effect.as({ status: 'configuration_error' } satisfies FormTokenResponse),
        ),
    ),
)
