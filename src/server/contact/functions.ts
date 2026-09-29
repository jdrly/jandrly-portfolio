import { createServerFn } from '@tanstack/react-start'
import type { ContactResponse, ContactSubmissionInput, FormTokenResponse } from './types'

/**
 * Server functions for the contact form. The implementation lives in
 * `runtime.ts` / `handler.ts` and is imported lazily so none of it (Effect,
 * Resend, Upstash, DNS, ...) can end up in the client bundle.
 */

/** Issues a signed `${issuedAt}.${nonce}.${hmac}` form token (server clock only). */
export const issueFormToken = createServerFn({ method: 'GET' }).handler(async (): Promise<FormTokenResponse> => {
    const { runIssueFormToken } = await import('./runtime')

    return runIssueFormToken()
})

export const sendContactMessage = createServerFn({ method: 'POST' })
    // Typing only: the payload is untrusted and fully validated inside the Effect pipeline,
    // which lets validation failures be handled like every other outcome.
    .validator((data: ContactSubmissionInput) => data)
    .handler(async ({ data }): Promise<ContactResponse> => {
        const { runContactSubmission } = await import('./runtime')

        return runContactSubmission(data)
    })
