import { useForm, useStore } from '@tanstack/react-form'
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { createContactSubmission } from './contactSubmission'
import { initBotIdOnce } from './initBotId'
import type { StandardSchemaV1 } from '@tanstack/react-form'
import type { ContactFormValues, ContactSubmissionDeps } from './contactSubmission'
import type { ContactFieldMessages } from '@/server/contact/rules'
import { issueFormToken, sendContactMessage } from '@/server/contact/functions'
import { HONEYPOT_FIELD, createContactFieldSchemas } from '@/server/contact/rules'
import * as m from '@/paraglide/messages'

export type { SubmitStatus } from './contactSubmission'

const TURNSTILE_SITE_KEY: string = import.meta.env.VITE_TURNSTILE_SITE_KEY || ''
/** Without a Turnstile sitekey the form cannot be verified; show the direct-contact card instead. */
export const IS_CONTACT_FORM_CONFIGURED = Boolean(TURNSTILE_SITE_KEY)

const STALE_CHECK_INTERVAL_MS = 5 * 60 * 1_000

const FIELD_MESSAGES: ContactFieldMessages = {
    nameTooShort: () => m.contact_validation_name_min(),
    emailInvalid: () => m.contact_validation_email_invalid(),
    phoneInvalid: () => m.contact_validation_phone_invalid(),
    messageTooShort: () => m.contact_validation_message_min(),
    tooLong: (max) => m.contact_validation_too_long({ max }),
    invalid: () => m.contact_validation_invalid_value(),
}

export type ContactFieldName = keyof ReturnType<typeof createContactFieldSchemas>

/** The server's field rules with localized messages (resolved when a field is validated), for `onBlur`. */
export const CONTACT_FIELD_VALIDATORS: Record<ContactFieldName, StandardSchemaV1<string, string>> = createContactFieldSchemas(
    FIELD_MESSAGES,
)

const EMPTY_VALUES: ContactFormValues & { [HONEYPOT_FIELD]: string } = {
    name: '',
    email: '',
    phone: '',
    message: '',
    [HONEYPOT_FIELD]: '',
}

const BROWSER_DEPS: ContactSubmissionDeps = {
    issueFormToken: () => issueFormToken(),
    sendMessage: (data) => sendContactMessage({ data }),
    now: () => Date.now(),
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
}

/**
 * The contact form for React: TanStack Form wired to the contact submission (form token, Turnstile
 * token, BotID, sending, status). Markup only has to render the fields, the challenge and the button.
 */
export function useContactForm() {
    const [submission] = useState(() => createContactSubmission(BROWSER_DEPS))
    const { status, challenge, isVerified } = useSyncExternalStore(submission.subscribe, submission.getSnapshot, submission.getSnapshot)

    useEffect(() => {
        void submission.refreshFormToken()
        initBotIdOnce(sendContactMessage.url)
    }, [submission])

    useEffect(() => {
        const refreshIfStale = () => {
            if (document.visibilityState === 'visible') {
                void submission.refreshIfStale()
            }
        }
        const interval = window.setInterval(refreshIfStale, STALE_CHECK_INTERVAL_MS)
        document.addEventListener('visibilitychange', refreshIfStale)

        return () => {
            window.clearInterval(interval)
            document.removeEventListener('visibilitychange', refreshIfStale)
        }
    }, [submission])

    const form = useForm({
        defaultValues: EMPTY_VALUES,
        // Editing any field dismisses the previous outcome (resetting the form does not).
        listeners: { onChange: () => submission.clearStatus() },
        onSubmit: async ({ value, formApi }) => {
            if (await submission.submit(value)) {
                formApi.reset(EMPTY_VALUES)
            }
        },
    })

    const canSubmitForm = useStore(form.store, (state) => state.canSubmit)
    const isSubmitting = useStore(form.store, (state) => state.isSubmitting)

    const submit = useCallback(() => {
        void form.handleSubmit()
    }, [form])

    return {
        /** TanStack Form instance for `form.Field`; validate fields with `CONTACT_FIELD_VALIDATORS`. */
        form,
        status,
        /** Valid fields and both anti-bot tokens present. */
        canSubmit: canSubmitForm && isVerified,
        isSubmitting,
        /** Pass to `<form action={...}>`. */
        submit,
        /** Props for `TurnstileWidget` (render with `key`), or `null` until the form token is known. */
        turnstile: challenge
            ? { key: challenge.key, siteKey: TURNSTILE_SITE_KEY, cData: challenge.cData, onTokenChange: submission.setTurnstileToken }
            : null,
    }
}

export type ContactFormApi = ReturnType<typeof useContactForm>['form']
