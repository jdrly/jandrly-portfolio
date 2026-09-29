import type { HONEYPOT_FIELD } from './rules'

/**
 * Shared (client + server) types for the contact form. Type-only on purpose; the
 * runtime contract (field rules, token timing) lives in `rules.ts`.
 */

export type ContactStatus = 'success' | 'validation_error' | 'rate_limited' | 'verification_error' | 'configuration_error' | 'send_error'

export interface ContactResponse {
    status: ContactStatus
}

export type FormTokenResponse = { status: 'ok'; token: string; nonce: string } | { status: 'configuration_error' }

/** Shape the browser sends to `sendContactMessage`. Everything is re-validated on the server. */
export interface ContactSubmissionInput {
    name: string
    email: string
    phone?: string
    message: string
    [HONEYPOT_FIELD]?: string
    formToken: string
    turnstileToken: string
}
