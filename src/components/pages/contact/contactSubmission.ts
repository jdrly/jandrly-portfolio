import type { ContactResponse, ContactStatus, ContactSubmissionInput, FormTokenResponse } from '@/server/contact/types'
import { FORM_TOKEN_MAX_AGE_MS, FORM_TOKEN_MIN_AGE_MS } from '@/server/contact/rules'

/** Refresh the form token half an hour before the server would consider it expired. */
export const FORM_TOKEN_REFRESH_AFTER_MS = FORM_TOKEN_MAX_AGE_MS - 30 * 60 * 1_000
/** Extra wait on top of the server minimum age, so client/server clock rounding never trips it. */
const MIN_AGE_MARGIN_MS = 500

export type SubmitStatus = ContactStatus | null

export type ContactFormValues = Omit<ContactSubmissionInput, 'formToken' | 'turnstileToken'>

/** Everything the submission needs from the outside world. Server functions in the browser, fakes in tests. */
export interface ContactSubmissionDeps {
    issueFormToken: () => Promise<FormTokenResponse>
    sendMessage: (data: ContactSubmissionInput) => Promise<ContactResponse>
    now: () => number
    sleep: (ms: number) => Promise<void>
}

export interface ContactSubmissionSnapshot {
    status: SubmitStatus
    /**
     * The Turnstile challenge to render, or `null` until the first form token arrives. `cData` binds the
     * Turnstile token to the form token; a new `key` means the widget must produce a fresh token.
     */
    challenge: { key: string; cData: string } | null
    /** Both anti-bot tokens are present. */
    isVerified: boolean
}

interface FormTokenState {
    token: string
    nonce: string
    /** Client clock at receipt; only compared with the client clock, so skew does not matter. */
    receivedAt: number
}

/**
 * The browser side of a contact submission: the signed form token (fetched, de-duplicated, refreshed
 * when stale), the Turnstile token, the minimum form age, sending and the resulting status. Both tokens
 * are single-use, so every submission — whatever its outcome — ends with a fresh pair.
 *
 * Framework-agnostic (`subscribe` / `getSnapshot` fit `useSyncExternalStore`) and fully driven by `deps`.
 */
export function createContactSubmission(deps: ContactSubmissionDeps) {
    let formToken: FormTokenState | null = null
    let turnstileToken = ''
    let status: SubmitStatus = null
    /** Bumped when the widget must re-issue a token although the form token (cData) stayed the same. */
    let challengeGeneration = 0
    let refreshing: Promise<void> | null = null
    let snapshot = buildSnapshot()
    const listeners = new Set<() => void>()

    function buildSnapshot(): ContactSubmissionSnapshot {
        return {
            status,
            challenge: formToken ? { key: `${formToken.nonce}:${challengeGeneration}`, cData: formToken.nonce } : null,
            isVerified: Boolean(formToken && turnstileToken),
        }
    }

    function emit() {
        snapshot = buildSnapshot()
        listeners.forEach((listener) => listener())
    }

    function isStale() {
        return !formToken || deps.now() - formToken.receivedAt > FORM_TOKEN_REFRESH_AFTER_MS
    }

    function refreshFormToken() {
        if (refreshing) {
            return refreshing
        }

        refreshing = deps
            .issueFormToken()
            .then((response) => {
                if (response.status !== 'ok') {
                    status = 'configuration_error'
                    return
                }

                formToken = { token: response.token, nonce: response.nonce, receivedAt: deps.now() }
            })
            .catch((error: unknown) => {
                console.error('Failed to load contact form token', error)
            })
            .finally(() => {
                refreshing = null
                emit()
            })

        return refreshing
    }

    /** Both tokens were spent: drop the Turnstile token and fetch a new form token (new cData, new challenge). */
    function renewTokens() {
        const spentNonce = formToken?.nonce
        turnstileToken = ''
        emit()

        void refreshFormToken().then(() => {
            // No new form token (network or configuration error): still force a fresh Turnstile token.
            if (formToken?.nonce === spentNonce) {
                challengeGeneration++
                emit()
            }
        })
    }

    return {
        subscribe(listener: () => void) {
            listeners.add(listener)
            return () => {
                listeners.delete(listener)
            }
        },

        getSnapshot() {
            return snapshot
        },

        /** Fetches a form token unless one is already on its way. */
        refreshFormToken,

        /** Keeps the form token fresh for visitors who leave the tab open for a long time. */
        refreshIfStale() {
            return isStale() ? refreshFormToken() : Promise.resolve()
        },

        /** Reported by the Turnstile widget; `''` when the token expired, errored or the widget went away. */
        setTurnstileToken(token: string) {
            if (token !== turnstileToken) {
                turnstileToken = token
                emit()
            }
        },

        clearStatus() {
            if (status !== null) {
                status = null
                emit()
            }
        },

        /** Sends the form. Resolves `true` when the message was accepted and the form should be cleared. */
        async submit(values: ContactFormValues): Promise<boolean> {
            const currentFormToken = formToken
            const currentTurnstileToken = turnstileToken

            if (!currentFormToken || !currentTurnstileToken) {
                return false
            }

            if (isStale()) {
                // A new nonce re-renders Turnstile; the form becomes submittable once it has a fresh token.
                await refreshFormToken()
                return false
            }

            // The server silently drops submissions made < 3 s after the token was issued.
            const remaining = FORM_TOKEN_MIN_AGE_MS + MIN_AGE_MARGIN_MS - (deps.now() - currentFormToken.receivedAt)
            if (remaining > 0) {
                await deps.sleep(remaining)
            }

            status = null
            emit()

            let result: ContactResponse
            try {
                result = await deps.sendMessage({ ...values, formToken: currentFormToken.token, turnstileToken: currentTurnstileToken })
            } catch (error) {
                console.error('Contact form submission failed', error)
                result = { status: 'send_error' }
            }

            status = result.status
            renewTokens()

            return result.status === 'success'
        },
    }
}

export type ContactSubmission = ReturnType<typeof createContactSubmission>
