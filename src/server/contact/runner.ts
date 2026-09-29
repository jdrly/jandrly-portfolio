import { ManagedRuntime } from 'effect'
import { handleContactSubmission, issueFormToken } from './handler'
import type { Layer } from 'effect'
import type { BotIdVerifier } from './botId'
import type { ContactConfig } from './config'
import type { Mailer } from './email'
import type { EmailDomainVerifier } from './emailDomain'
import type { ContactRequestContext } from './handler'
import type { ContactLog } from './log'
import type { RateLimiter } from './rateLimit'
import type { Turnstile } from './turnstile'
import type { ContactResponse, FormTokenResponse } from './types'

export type ContactServices = ContactConfig | ContactLog | Turnstile | RateLimiter | BotIdVerifier | EmailDomainVerifier | Mailer

/**
 * Runs the contact pipeline on one long-lived runtime (so the in-memory rate
 * limiter and the MX cache survive between requests) and turns every failure
 * into a client response:
 * - the services cannot be built (invalid environment value, missing module): `configuration_error`;
 * - the pipeline crashes unexpectedly after that: `send_error`.
 */
export function makeContactRunner<TError>(layer: Layer.Layer<ContactServices, TError>) {
    const runtime = ManagedRuntime.make(layer)

    /** Builds the services once; the outcome (success or failure) is cached by the runtime. */
    async function servicesReady() {
        try {
            await runtime.context()
            return true
        } catch (error) {
            console.error('Contact form services failed to start', error)
            return false
        }
    }

    return {
        async submit(input: unknown, request: ContactRequestContext): Promise<ContactResponse> {
            if (!(await servicesReady())) {
                return { status: 'configuration_error' }
            }

            try {
                return await runtime.runPromise(handleContactSubmission(input, request))
            } catch (error) {
                console.error('Contact form pipeline crashed', error)
                return { status: 'send_error' }
            }
        },

        async issueFormToken(): Promise<FormTokenResponse> {
            if (!(await servicesReady())) {
                return { status: 'configuration_error' }
            }

            try {
                return await runtime.runPromise(issueFormToken)
            } catch (error) {
                console.error('Issuing contact form token failed', error)
                return { status: 'configuration_error' }
            }
        },
    }
}
