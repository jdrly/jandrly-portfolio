import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FORM_TOKEN_REFRESH_AFTER_MS, createContactSubmission } from './contactSubmission'
import type { ContactFormValues, ContactSubmissionDeps } from './contactSubmission'
import type { ContactResponse, ContactSubmissionInput, FormTokenResponse } from '@/server/contact/types'
import { FORM_TOKEN_MIN_AGE_MS } from '@/server/contact/rules'

const VALUES: ContactFormValues = {
    name: 'Jan Novák',
    email: 'jan@example.com',
    phone: '',
    message: 'Dobrý den, mám zájem o web.',
    subject: '',
}

interface FakeServer {
    deps: ContactSubmissionDeps
    sent: Array<ContactSubmissionInput>
    sleeps: Array<number>
    tokenRequests: () => number
    advance: (ms: number) => void
    /** Next responses of the fake server (default: fresh token / success). */
    nextToken: Array<FormTokenResponse | Error>
    nextSend: Array<ContactResponse | Error>
}

function fakeServer(): FakeServer {
    let clock = 1_000_000
    let issued = 0
    const server: FakeServer = {
        sent: [],
        sleeps: [],
        nextToken: [],
        nextSend: [],
        tokenRequests: () => issued,
        advance: (ms) => {
            clock += ms
        },
        deps: {
            issueFormToken: () => {
                issued++
                const next = server.nextToken.shift() ?? { status: 'ok', token: `token-${issued}`, nonce: `nonce-${issued}` }
                return next instanceof Error ? Promise.reject(next) : Promise.resolve(next)
            },
            sendMessage: (data) => {
                server.sent.push(data)
                const next = server.nextSend.shift() ?? { status: 'success' }
                return next instanceof Error ? Promise.reject(next) : Promise.resolve(next)
            },
            now: () => clock,
            sleep: (ms) => {
                server.sleeps.push(ms)
                clock += ms
                return Promise.resolve()
            },
        },
    }

    return server
}

/** Lets the fire-and-forget token refresh after a submission settle. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

async function readySubmission(server = fakeServer()) {
    const submission = createContactSubmission(server.deps)
    await submission.refreshFormToken()
    submission.setTurnstileToken('turnstile-1')
    server.advance(10_000)
    return { submission, server }
}

beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
    vi.restoreAllMocks()
})

describe('contact submission', () => {
    it('is not verified until both the form token and the Turnstile token are present', async () => {
        const server = fakeServer()
        const submission = createContactSubmission(server.deps)

        expect(submission.getSnapshot()).toEqual({ status: null, challenge: null, isVerified: false })

        await submission.refreshFormToken()
        expect(submission.getSnapshot()).toMatchObject({ challenge: { cData: 'nonce-1' }, isVerified: false })

        submission.setTurnstileToken('turnstile-1')
        expect(submission.getSnapshot().isVerified).toBe(true)
    })

    it('de-duplicates concurrent form token requests', async () => {
        const server = fakeServer()
        const submission = createContactSubmission(server.deps)

        await Promise.all([submission.refreshFormToken(), submission.refreshFormToken(), submission.refreshIfStale()])

        expect(server.tokenRequests()).toBe(1)
    })

    it('reports a configuration error when no form token can be issued', async () => {
        const server = fakeServer()
        server.nextToken.push({ status: 'configuration_error' })
        const submission = createContactSubmission(server.deps)

        await submission.refreshFormToken()

        expect(submission.getSnapshot()).toMatchObject({ status: 'configuration_error', challenge: null })
    })

    it('sends the values with both tokens and reports the outcome', async () => {
        const { submission, server } = await readySubmission()

        await expect(submission.submit(VALUES)).resolves.toBe(true)

        expect(server.sent).toEqual([{ ...VALUES, formToken: 'token-1', turnstileToken: 'turnstile-1' }])
        expect(submission.getSnapshot().status).toBe('success')
        expect(server.sleeps).toEqual([])
    })

    it('waits out the server minimum form age before sending', async () => {
        const server = fakeServer()
        const submission = createContactSubmission(server.deps)
        await submission.refreshFormToken()
        submission.setTurnstileToken('turnstile-1')
        server.advance(1_000)

        await submission.submit(VALUES)

        expect(server.sleeps).toEqual([FORM_TOKEN_MIN_AGE_MS + 500 - 1_000])
        expect(server.sent).toHaveLength(1)
    })

    it('treats both tokens as single-use: new form token, new challenge, Turnstile token dropped', async () => {
        const { submission } = await readySubmission()
        const before = submission.getSnapshot().challenge

        await submission.submit(VALUES)
        expect(submission.getSnapshot().isVerified).toBe(false)
        await settle()

        const after = submission.getSnapshot().challenge
        expect(after?.cData).toBe('nonce-2')
        expect(after?.key).not.toBe(before?.key)
    })

    it('still forces a fresh Turnstile challenge when the new form token cannot be loaded', async () => {
        const { submission, server } = await readySubmission()
        const before = submission.getSnapshot().challenge
        server.nextToken.push(new Error('offline'))

        await submission.submit(VALUES)
        await settle()

        const after = submission.getSnapshot().challenge
        expect(after?.cData).toBe(before?.cData)
        expect(after?.key).not.toBe(before?.key)
    })

    it.each([
        ['a rejected submission', { status: 'rate_limited' } as const, 'rate_limited'],
        ['a network failure', new Error('offline'), 'send_error'],
    ])('keeps the values after %s', async (_label, response, status) => {
        const { submission, server } = await readySubmission()
        server.nextSend.push(response)

        await expect(submission.submit(VALUES)).resolves.toBe(false)
        expect(submission.getSnapshot().status).toBe(status)
    })

    it('refreshes a stale form token instead of sending', async () => {
        const { submission, server } = await readySubmission()
        server.advance(FORM_TOKEN_REFRESH_AFTER_MS)

        await expect(submission.submit(VALUES)).resolves.toBe(false)

        expect(server.sent).toHaveLength(0)
        expect(submission.getSnapshot().challenge?.cData).toBe('nonce-2')
    })

    it('does nothing without both tokens', async () => {
        const server = fakeServer()
        const submission = createContactSubmission(server.deps)
        await submission.refreshFormToken()

        await expect(submission.submit(VALUES)).resolves.toBe(false)
        expect(server.sent).toHaveLength(0)
    })

    it('only refreshes when the token is stale', async () => {
        const { submission, server } = await readySubmission()

        await submission.refreshIfStale()
        expect(server.tokenRequests()).toBe(1)

        server.advance(FORM_TOKEN_REFRESH_AFTER_MS)
        await submission.refreshIfStale()
        expect(server.tokenRequests()).toBe(2)
    })

    it('clears the status and notifies subscribers with a new snapshot only on change', async () => {
        const { submission, server } = await readySubmission()
        server.nextSend.push({ status: 'validation_error' })
        await submission.submit(VALUES)
        await settle()

        const listener = vi.fn()
        submission.subscribe(listener)
        const snapshot = submission.getSnapshot()

        submission.setTurnstileToken('')
        expect(listener).not.toHaveBeenCalled()
        expect(submission.getSnapshot()).toBe(snapshot)

        submission.clearStatus()
        expect(listener).toHaveBeenCalledTimes(1)
        expect(submission.getSnapshot().status).toBeNull()
    })
})
