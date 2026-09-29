import { CircleAlert, CircleCheck } from 'lucide-react'
import { TurnstileWidget } from './TurnstileWidget'
import { CONTACT_FIELD_VALIDATORS, IS_CONTACT_FORM_CONFIGURED, useContactForm } from './useContactForm'
import type { ChangeEvent, ReactNode } from 'react'
import type { ContactFieldName, ContactFormApi, SubmitStatus } from './useContactForm'
import type { FormFieldProps } from '@/components/ui/FormField'
import type { GlyphId } from '@/components/ui/GlyphWord'
import { useProtectedEmail } from '@/components/ProtectedEmail'
import { ButtonLink } from '@/components/ui/Button'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { FormField } from '@/components/ui/FormField'
import { GlyphWord } from '@/components/ui/GlyphWord'
import { SubmitButton } from '@/components/ui/SubmitButton'
import { keepHyphenatedWords } from '@/lib/typography'
import { cn } from '@/lib/utils'
import { HONEYPOT_FIELD } from '@/server/contact/rules'
import * as m from '@/paraglide/messages'

const WINDOW_GLYPHS: ReadonlyArray<GlyphId> = [2, 13, 11, 10]

const WINDOW_TITLE_CLASS =
    'font-display text-[clamp(1.875rem,0.5714vw+1.7357rem,2.25rem)] leading-[1.08] font-black tracking-[-0.028em] text-paper'

interface FieldMeta {
    state: {
        meta: {
            isTouched: boolean
            errors: Array<unknown>
        }
    }
}

function getErrorMessage(error: unknown) {
    if (typeof error === 'string') {
        return error
    }

    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
        return error.message
    }

    return m.contact_validation_invalid_value()
}

/** First validation error of a touched field, or `undefined`. */
function fieldError(field: FieldMeta) {
    const { isTouched, errors } = field.state.meta
    return isTouched && errors.length > 0 ? getErrorMessage(errors[0]) : undefined
}

/**
 * Dark "code editor" window from the design: grain-dark surface with clipped corners, a window bar
 * (traffic-light dots, file name, glyph word) and the body.
 */
function FormWindow({ children }: { children: ReactNode }) {
    return (
        <div className="bg-grain-dark overflow-hidden rounded-tl-3xl rounded-br-3xl text-paper lg:rounded-tl-[32px] lg:rounded-br-[32px]">
            <div className="flex items-center justify-between gap-4 border-b-[1.5px] border-line-dark px-5 py-3.5 lg:px-6 lg:py-4">
                <div className="flex items-center gap-3 lg:gap-3.5">
                    <span aria-hidden="true" className="flex gap-[5px] lg:gap-1.5">
                        <span className="size-[9px] rounded-full bg-coral lg:size-2.5" />
                        <span className="size-[9px] rounded-full bg-on-dark-label lg:size-2.5" />
                        <span className="size-[9px] rounded-full bg-line-dark-strong lg:size-2.5" />
                    </span>
                    <span aria-hidden="true" className="font-mono text-label font-semibold tracking-[0.025rem] text-paper normal-case">
                        contact-request.ts
                    </span>
                </div>
                <GlyphWord glyphs={WINDOW_GLYPHS} className="hidden gap-1 text-[13px] text-on-dark-label lg:inline-flex" />
            </div>
            <div className="flex flex-col gap-[18px] px-5 pt-6 pb-7 lg:gap-[22px] lg:px-8 lg:pt-8 lg:pb-9">{children}</div>
        </div>
    )
}

const STATUS_MESSAGES: Record<Exclude<SubmitStatus, null | 'success'>, () => string> = {
    configuration_error: m.contact_form_error_not_configured,
    send_error: m.contact_form_error_network,
    verification_error: m.contact_form_error_verification,
    rate_limited: m.contact_form_error_rate_limited,
    validation_error: m.contact_form_error_validation,
}

/** Success / error panel shown right above the submit button. */
function SubmitFeedback({ status }: { status: SubmitStatus }) {
    if (status === null) {
        return null
    }

    const isSuccess = status === 'success'
    const Icon = isSuccess ? CircleCheck : CircleAlert

    return (
        <div
            role={isSuccess ? 'status' : 'alert'}
            className={cn(
                'flex items-start gap-3 rounded-tl-[10px] rounded-br-[10px] border-[1.5px] bg-white/3 px-4 py-3.5',
                isSuccess ? 'border-success' : 'border-coral',
            )}
        >
            <Icon aria-hidden="true" className={cn('mt-px size-[18px] shrink-0', isSuccess ? 'text-success' : 'text-coral')} />
            <div className="flex flex-col gap-1">
                <p className={cn('font-mono text-label uppercase', isSuccess ? 'text-success' : 'text-coral')}>
                    {isSuccess ? m.contact_form_status_sent() : m.contact_form_status_error()}
                </p>
                {isSuccess ? (
                    <p className="text-body-sm text-paper">
                        <strong className="font-bold">{m.contact_form_success_title()}.</strong> {m.contact_form_success_text()}
                    </p>
                ) : (
                    <p className="text-body-sm text-paper">{keepHyphenatedWords(STATUS_MESSAGES[status]())}</p>
                )}
            </div>
        </div>
    )
}

/** Shown instead of the form when no Turnstile sitekey is configured: a direct e-mail call to action. */
function DirectContactCard() {
    const email = useProtectedEmail()

    return (
        <FormWindow>
            <Eyebrow tone="on-dark" glyphs={null}>
                {m.contact_direct_label()}
            </Eyebrow>
            <h2 className={WINDOW_TITLE_CLASS}>{keepHyphenatedWords(m.contact_direct_heading())}</h2>
            <p className="text-body text-on-dark">{m.contact_direct_text()}</p>
            <ButtonLink href={email.href} className="mt-2">
                {m.contact_direct_button()}
            </ButtonLink>
        </FormWindow>
    )
}

export function ContactForm() {
    if (!IS_CONTACT_FORM_CONFIGURED) {
        return <DirectContactCard />
    }

    return <ConfiguredContactForm />
}

/** Presentational `FormField` props; value, events, error and ids come from the bound field. */
type TextFieldPresentation<T = FormFieldProps> = T extends unknown
    ? Omit<T, 'id' | 'name' | 'value' | 'onChange' | 'onBlur' | 'error' | 'form'>
    : never

type ContactTextFieldProps = TextFieldPresentation & {
    form: ContactFormApi
    name: ContactFieldName
}

/** A visible contact field: the design's `FormField` bound to the form, validated on blur with the server's rules. */
function ContactTextField({ form, name, ...fieldProps }: ContactTextFieldProps) {
    return (
        <form.Field name={name} validators={{ onBlur: CONTACT_FIELD_VALIDATORS[name] }}>
            {(field) => (
                <FormField
                    {...(fieldProps as FormFieldProps)}
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onChange={(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                    error={fieldError(field)}
                />
            )}
        </form.Field>
    )
}

function ConfiguredContactForm() {
    const { form, status, canSubmit, isSubmitting, submit, turnstile } = useContactForm()

    return (
        <FormWindow>
            <h2 id="contact-form-title" className={WINDOW_TITLE_CLASS}>
                {m.contact_form_heading()}
            </h2>

            <form aria-labelledby="contact-form-title" className="flex flex-col gap-[18px] lg:gap-[22px]" action={submit}>
                <form.Field name={HONEYPOT_FIELD}>
                    {(field) => (
                        <div aria-hidden="true" className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden">
                            <label htmlFor={`contact-${field.name}`}>Subject</label>
                            <input
                                type="text"
                                id={`contact-${field.name}`}
                                name={field.name}
                                value={field.state.value}
                                onChange={(event) => field.handleChange(event.target.value)}
                                tabIndex={-1}
                                autoComplete="off"
                                data-1p-ignore
                                data-lpignore="true"
                                data-bwignore
                                data-form-type="other"
                            />
                        </div>
                    )}
                </form.Field>

                <ContactTextField
                    form={form}
                    name="name"
                    label={m.contact_form_name()}
                    typeHint="string"
                    type="text"
                    autoComplete="name"
                    placeholder={m.contact_form_name_placeholder()}
                />
                <ContactTextField
                    form={form}
                    name="email"
                    label={m.contact_form_email()}
                    typeHint="string"
                    type="email"
                    autoComplete="email"
                    spellCheck={false}
                    placeholder={m.contact_form_email_placeholder()}
                />
                <ContactTextField
                    form={form}
                    name="phone"
                    label={m.contact_form_phone()}
                    typeHint="string?"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder={m.contact_form_phone_placeholder()}
                />
                <ContactTextField
                    form={form}
                    name="message"
                    multiline
                    label={m.contact_form_message()}
                    typeHint="text"
                    rows={5}
                    placeholder={m.contact_form_message_placeholder()}
                />

                {/* Invisible unless Turnstile needs a visible challenge, which then pushes the submit row down. */}
                {turnstile ? (
                    <TurnstileWidget
                        key={turnstile.key}
                        siteKey={turnstile.siteKey}
                        cData={turnstile.cData}
                        onTokenChange={turnstile.onTokenChange}
                    />
                ) : null}

                <SubmitFeedback status={status} />

                <SubmitButton disabled={!canSubmit} isPending={isSubmitting} pendingLabel={m.contact_form_submitting()}>
                    {m.contact_form_submit()}
                </SubmitButton>
            </form>
        </FormWindow>
    )
}
