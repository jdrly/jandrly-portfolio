import { createHash } from 'node:crypto'
import { Context, Effect, Layer, Predicate } from 'effect'
import { splitEmail } from './checks'

/**
 * Short, non-reversible-at-a-glance fingerprint for correlating log lines
 * (e.g. repeated submissions from one address) without logging the value.
 */
export function fingerprint(value: string) {
    return createHash('sha256').update(`jandrly-contact:${value.trim().toLowerCase()}`).digest('hex').slice(0, 12)
}

export type SubmissionOutcome =
    'sent' | 'accepted_dry_run' | 'rejected' | 'dropped' | 'rate_limited' | 'send_failed' | 'configuration_error'

/**
 * Everything the contact form logs. Callers pass raw values (`email`, `error`);
 * the log redacts them, so no caller can leak an address or a message body.
 */
export type ContactEvent =
    /** Exactly one per submission (and one per failed form token request). */
    | {
          readonly event: 'contact_form'
          readonly outcome: SubmissionOutcome
          readonly reason?: string
          readonly codes?: ReadonlyArray<string>
          readonly issues?: ReadonlyArray<string>
          readonly ip?: string
          readonly hostname?: string
          /** Raw address; logged only as a fingerprint and its domain. */
          readonly email?: string
          /** Configuration problem description (never user input). */
          readonly message?: string
          readonly error?: unknown
      }
    | {
          readonly event: 'contact_dry_run'
          readonly email: string
          readonly nameChars: number
          readonly messageChars: number
          readonly hasPhone: boolean
          readonly subjectChars: number
      }
    | { readonly event: 'contact_botid_error'; readonly error: unknown }
    | { readonly event: 'contact_rate_limit_error'; readonly error: unknown }
    | { readonly event: 'contact_turnstile'; readonly codes: ReadonlyArray<string> }
    | { readonly event: 'contact_mx_lookup_inconclusive'; readonly domain: string }

export type LogLevel = 'info' | 'warn' | 'error'

/** A redacted, JSON-ready log entry. */
export interface LogEntry {
    readonly level: LogLevel
    readonly fields: Readonly<Record<string, unknown>>
}

const EMAIL_IN_TEXT = /[^\s@<>"'(),;:]+@[^\s@<>"'(),;:]+/g
const MAX_TEXT = 300

function scrubText(value: string) {
    return value.replace(EMAIL_IN_TEXT, '[email]').slice(0, MAX_TEXT)
}

/** Errors are reduced to their name and a scrubbed message: third-party errors may echo request data. */
function redactError(error: unknown) {
    if (Predicate.isObject(error) && 'message' in error && Predicate.isString(error.message)) {
        return { name: 'name' in error && Predicate.isString(error.name) ? error.name : 'Error', message: scrubText(error.message) }
    }

    return { message: scrubText(String(error)) }
}

function redactEmail(email: string | undefined) {
    return email?.includes('@') ? { emailHash: fingerprint(email), emailDomain: splitEmail(email).domain.slice(0, 80) } : {}
}

function levelOf(event: ContactEvent): LogLevel {
    switch (event.event) {
        case 'contact_form':
            return event.outcome === 'configuration_error' || event.outcome === 'send_failed' ? 'error' : 'info'
        case 'contact_botid_error':
        case 'contact_rate_limit_error':
            return 'error'
        case 'contact_turnstile':
        case 'contact_mx_lookup_inconclusive':
            return 'warn'
        case 'contact_dry_run':
            return 'info'
    }
}

/** The single redaction rule: plain e-mail addresses and raw errors never reach a log line. */
export function redactContactEvent(event: ContactEvent): LogEntry {
    const { email, error, ...rest } = event as ContactEvent & { email?: string; error?: unknown }
    const fields: Record<string, unknown> = { ...rest, ...redactEmail(email) }

    if ('error' in event) {
        fields.error = redactError(error)
    }

    if (Predicate.isString(fields.hostname)) {
        fields.hostname = fields.hostname.slice(0, 120)
    }

    return { level: levelOf(event), fields }
}

export class ContactLog extends Context.Service<
    ContactLog,
    {
        readonly record: (event: ContactEvent) => Effect.Effect<void>
    }
>()('jandrly/server/contact/ContactLog') {
    /** One structured JSON line per event on the console (collected by Vercel). */
    static readonly layer = Layer.succeed(
        ContactLog,
        ContactLog.of({
            record: (event) =>
                Effect.sync(() => {
                    const { level, fields } = redactContactEvent(event)
                    console[level](JSON.stringify(fields))
                }),
        }),
    )

    /** Records redacted entries in `entries` (tests). */
    static readonly layerMemory = (entries: Array<LogEntry>) =>
        Layer.succeed(
            ContactLog,
            ContactLog.of({
                record: (event) =>
                    Effect.sync(() => {
                        entries.push(redactContactEvent(event))
                    }),
            }),
        )
}
