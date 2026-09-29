import { z } from 'zod'
import { HONEYPOT_FIELD, createContactFieldSchemas, sanitizeSingleLine } from './rules'

const fields = createContactFieldSchemas()

export const contactSubmissionSchema = z.object({
    name: fields.name,
    email: fields.email,
    phone: fields.phone.optional().transform((value) => value ?? ''),
    message: fields.message,
    [HONEYPOT_FIELD]: z.string().max(500).optional(),
    formToken: z.string().min(1).max(200),
    turnstileToken: z.string().min(1).max(2048),
})

const MAX_SUBJECT_NAME_LENGTH = 60

/** Builds a header-safe subject line. The name is already sanitized, but never trust a single layer. */
export function buildEmailSubject(name: string) {
    // sanitizeSingleLine collapses every line break (\s covers \r \n \u2028 \u2029, \u0085 is stripped).
    const safeName = sanitizeSingleLine(name)
    const truncated = safeName.length > MAX_SUBJECT_NAME_LENGTH ? `${safeName.slice(0, MAX_SUBJECT_NAME_LENGTH - 1)}…` : safeName

    return `New portfolio contact request from ${truncated}`
}
