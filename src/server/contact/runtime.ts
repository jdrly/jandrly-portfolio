import { getRequestHeader, getRequestIP, setResponseHeader } from '@tanstack/react-start/server'
import { Layer } from 'effect'
import { BotIdVerifier } from './botId'
import { ContactConfig } from './config'
import { Mailer } from './email'
import { EmailDomainVerifier } from './emailDomain'
import { ContactLog } from './log'
import { RateLimiter } from './rateLimit'
import { makeContactRunner } from './runner'
import { Turnstile } from './turnstile'
import type { ContactRequestContext } from './handler'
import type { ContactResponse, FormTokenResponse } from './types'

/** Production wiring of every contact service. Swap individual layers in tests. */
const ContactLive = Layer.mergeAll(Turnstile.layer, RateLimiter.layer, BotIdVerifier.layer, EmailDomainVerifier.layer, Mailer.layer).pipe(
    Layer.provideMerge(ContactConfig.layer),
    Layer.provideMerge(ContactLog.layer),
)

/** One runner per server instance (per instance only on serverless). */
const runner = makeContactRunner(ContactLive)

function readRequestContext(): ContactRequestContext {
    return {
        realIp: getRequestHeader('x-real-ip'),
        forwardedFor: getRequestHeader('x-forwarded-for'),
        socketIp: getRequestIP(),
        host: getRequestHeader('host'),
    }
}

export function runContactSubmission(input: unknown): Promise<ContactResponse> {
    return runner.submit(input, readRequestContext())
}

export function runIssueFormToken(): Promise<FormTokenResponse> {
    setResponseHeader('Cache-Control', 'no-store')

    return runner.issueFormToken()
}
