import { z } from 'zod'

/**
 * The contact form contract shared by the browser and the server: field rules,
 * form token timing and anti-bot constants. Client-safe on purpose — it may only
 * import `zod` (no Effect, no `node:*`), because the form validates with the same
 * rules the server enforces.
 */

/** Name of the hidden honeypot input. Deliberately not a common autofill token. */
export const HONEYPOT_FIELD = 'subject' as const

/** Turnstile `action` the widget is rendered with and siteverify must report. */
export const TURNSTILE_ACTION = 'contact'

/** A form token younger than this is "filled too fast" (server clock only). */
export const FORM_TOKEN_MIN_AGE_MS = 3_000
/** A form token older than this is expired. */
export const FORM_TOKEN_MAX_AGE_MS = 2 * 60 * 60 * 1_000

export const CONTACT_FIELD_LIMITS = {
    name: { min: 2, max: 120 },
    email: { max: 254 },
    phone: { max: 40 },
    message: { min: 10, max: 5000 },
} as const

/** Any kind of line break, including the Unicode line/paragraph separators. */
const LINE_BREAK = /[\r\n\u0085\u2028\u2029]/
/**
 * C0/C1 control characters (except tab and newline, handled separately), zero-width
 * characters and bidi overrides. They are never needed in a contact message and are
 * used for header injection and filter evasion.
 */
// eslint-disable-next-line no-control-regex -- matching control characters is the point
const INVISIBLE_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B\u2060\uFEFF\u202A-\u202E\u2066-\u2069]/g
const PHONE_PATTERN = /^[+\d\s()./-]*$/

function stripInvisibleChars(value: string) {
    return value.replace(INVISIBLE_CHARS, '')
}

/** Normalizes a single-line value: removes invisible chars, turns tabs into spaces and collapses whitespace. */
export function sanitizeSingleLine(value: string) {
    return stripInvisibleChars(value).replace(/\s+/g, ' ').trim()
}

/** Normalizes a multi-line message: unifies line endings, removes invisible chars and trims. */
export function sanitizeMultiline(value: string) {
    return stripInvisibleChars(value.replace(/\r\n?/g, '\n').replace(/[\u0085\u2028\u2029]/g, '\n'))
        .replace(/\n{4,}/g, '\n\n\n')
        .trim()
}

/** Localized error messages for the form. Without them (on the server) zod's defaults are used. */
export interface ContactFieldMessages {
    nameTooShort: () => string
    emailInvalid: () => string
    phoneInvalid: () => string
    messageTooShort: () => string
    tooLong: (max: number) => string
    invalid: () => string
}

function errorFrom(message: (() => string) | undefined) {
    return message ? { error: () => message() } : undefined
}

/**
 * Per-field schemas: raw-length guard → line-break check → sanitization → the real limits.
 * The server parses with them; the form uses them as field validators, so a value the form
 * accepts is a value the server accepts.
 */
export function createContactFieldSchemas(messages?: ContactFieldMessages) {
    const tooLong = (max: number) => errorFrom(messages ? () => messages.tooLong(max) : undefined)
    const invalid = errorFrom(messages?.invalid)

    function singleLine(max: number) {
        return z
            .string()
            .max(max * 2, tooLong(max))
            .refine((value) => !LINE_BREAK.test(value), invalid ?? 'Line breaks are not allowed')
            .transform(sanitizeSingleLine)
    }

    return {
        name: singleLine(CONTACT_FIELD_LIMITS.name.max).pipe(
            z
                .string()
                .min(CONTACT_FIELD_LIMITS.name.min, errorFrom(messages?.nameTooShort))
                .max(CONTACT_FIELD_LIMITS.name.max, tooLong(CONTACT_FIELD_LIMITS.name.max)),
        ),
        email: z
            .string()
            .max(320, tooLong(CONTACT_FIELD_LIMITS.email.max))
            .refine((value) => !LINE_BREAK.test(value), invalid ?? 'Line breaks are not allowed')
            .transform(sanitizeSingleLine)
            .pipe(z.email(errorFrom(messages?.emailInvalid)).max(CONTACT_FIELD_LIMITS.email.max, tooLong(CONTACT_FIELD_LIMITS.email.max))),
        phone: singleLine(CONTACT_FIELD_LIMITS.phone.max).pipe(
            z
                .string()
                .max(CONTACT_FIELD_LIMITS.phone.max, tooLong(CONTACT_FIELD_LIMITS.phone.max))
                .regex(PHONE_PATTERN, errorFrom(messages?.phoneInvalid)),
        ),
        message: z
            .string()
            .max(CONTACT_FIELD_LIMITS.message.max * 2, tooLong(CONTACT_FIELD_LIMITS.message.max))
            .transform(sanitizeMultiline)
            .pipe(
                z
                    .string()
                    .min(CONTACT_FIELD_LIMITS.message.min, errorFrom(messages?.messageTooShort))
                    .max(CONTACT_FIELD_LIMITS.message.max, tooLong(CONTACT_FIELD_LIMITS.message.max)),
            ),
    }
}
