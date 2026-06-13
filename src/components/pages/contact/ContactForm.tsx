import { useForm } from '@tanstack/react-form'
import { useServerFn } from '@tanstack/react-start'
import { AnimatePresence, m as motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Send } from 'lucide-react'
import { useState } from 'react'
import { z } from 'zod'
import { sendContactMessage } from './sendContactMessage'
import { FadeIn, smoothEase } from '@/components/motion'
import * as m from '@/paraglide/messages'

function createNameSchema() {
    return z.string().min(2, m.contact_validation_name_min())
}

function createEmailSchema() {
    return z.email(m.contact_validation_email_invalid())
}

function createPhoneSchema() {
    return z.string().refine((val) => val === '' || /^[+\d\s-]*$/.test(val), m.contact_validation_phone_invalid())
}

function createMessageSchema() {
    return z.string().min(10, m.contact_validation_message_min())
}

interface FieldErrorProps {
    field: {
        state: {
            meta: {
                isTouched: boolean
                errors: Array<unknown>
            }
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

    return 'Invalid value'
}

function FieldError({ field }: FieldErrorProps) {
    const hasError = field.state.meta.isTouched && field.state.meta.errors.length > 0
    const errorMessage = field.state.meta.errors[0]
    const displayMessage = hasError ? getErrorMessage(errorMessage) : ''

    return (
        <AnimatePresence>
            {hasError && (
                <motion.span
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2, ease: smoothEase }}
                    className="flex items-center gap-1 text-sm text-red-400"
                >
                    <AlertCircle size={14} />
                    {displayMessage}
                </motion.span>
            )}
        </AnimatePresence>
    )
}

type SubmitStatus = 'success' | 'configuration_error' | 'send_error' | null

export function ContactForm() {
    const sendContactMessageFn = useServerFn(sendContactMessage)
    const [submitStatus, setSubmitStatus] = useState<SubmitStatus>(null)

    const form = useForm({
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            message: '',
            botcheck: '',
        },
        onSubmit: async ({ value, formApi }) => {
            setSubmitStatus(null)
            const result = await sendContactMessageFn({ data: value })

            setSubmitStatus(result.status)

            if (result.status === 'success') {
                formApi.reset()
            }
        },
    })

    const handleFormAction = () => {
        void form.handleSubmit()
    }

    return (
        <FadeIn direction="right" delay={0.2}>
            <div className="overflow-hidden rounded-2xl border border-border-subtle bg-[#0d0d0d] shadow-2xl shadow-black/50">
                <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-3">
                    <div className="h-3 w-3 rounded-full bg-[#ff5f57]" aria-hidden="true" />
                    <div className="h-3 w-3 rounded-full bg-[#febc2e]" aria-hidden="true" />
                    <div className="h-3 w-3 rounded-full bg-[#28c840]" aria-hidden="true" />
                    <span className="ml-4 font-mono text-xs text-text-subtle">contact-request.ts</span>
                </div>

                <form className="space-y-6 p-6 sm:p-8 md:p-12" action={handleFormAction}>
                    <h2 className="text-xl font-bold sm:text-2xl">{m.contact_form_heading()}</h2>

                    <AnimatePresence>
                        {submitStatus === 'success' && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex items-start gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-400"
                            >
                                <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                                <span>
                                    <strong className="block">{m.contact_form_success_title()}</strong>
                                    {m.contact_form_success_text()}
                                </span>
                            </motion.div>
                        )}

                        {submitStatus === 'configuration_error' && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400"
                            >
                                <AlertCircle size={18} />
                                {m.contact_form_error_not_configured()}
                            </motion.div>
                        )}

                        {submitStatus === 'send_error' && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400"
                            >
                                <AlertCircle size={18} />
                                {m.contact_form_error_network()}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form.Field name="botcheck">
                        {(field) => (
                            <input
                                type="text"
                                id={field.name}
                                name={field.name}
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                                aria-hidden="true"
                                aria-label="Leave this field empty"
                                className="hidden"
                                style={{ display: 'none' }}
                                tabIndex={-1}
                                autoComplete="off"
                            />
                        )}
                    </form.Field>

                    <form.Field
                        name="name"
                        validators={{
                            onBlur: createNameSchema(),
                        }}
                    >
                        {(field) => (
                            <div className="space-y-2">
                                <label htmlFor={field.name} className="text-sm font-medium uppercase tracking-wider text-text-muted">
                                    {m.contact_form_name()}
                                </label>
                                <motion.input
                                    type="text"
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onChange={(e) => {
                                        setSubmitStatus(null)
                                        field.handleChange(e.target.value)
                                    }}
                                    onBlur={field.handleBlur}
                                    className={`w-full rounded-xl border bg-[#0a0a0a] px-4 py-4 text-white transition-colors focus:border-accent focus:outline-none ${
                                        field.state.meta.isTouched && field.state.meta.errors.length > 0
                                            ? 'border-red-500'
                                            : 'border-border'
                                    }`}
                                    placeholder={m.contact_form_name_placeholder()}
                                    whileFocus={{ scale: 1.01 }}
                                    transition={{ duration: 0.2, ease: smoothEase }}
                                />
                                <FieldError field={field} />
                            </div>
                        )}
                    </form.Field>

                    <form.Field
                        name="email"
                        validators={{
                            onBlur: createEmailSchema(),
                        }}
                    >
                        {(field) => (
                            <div className="space-y-2">
                                <label htmlFor={field.name} className="text-sm font-medium uppercase tracking-wider text-text-muted">
                                    {m.contact_form_email()}
                                </label>
                                <motion.input
                                    type="email"
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onChange={(e) => {
                                        setSubmitStatus(null)
                                        field.handleChange(e.target.value)
                                    }}
                                    onBlur={field.handleBlur}
                                    className={`w-full rounded-xl border bg-[#0a0a0a] px-4 py-4 text-white transition-colors focus:border-accent focus:outline-none ${
                                        field.state.meta.isTouched && field.state.meta.errors.length > 0
                                            ? 'border-red-500'
                                            : 'border-border'
                                    }`}
                                    placeholder={m.contact_form_email_placeholder()}
                                    whileFocus={{ scale: 1.01 }}
                                    transition={{ duration: 0.2, ease: smoothEase }}
                                />
                                <FieldError field={field} />
                            </div>
                        )}
                    </form.Field>

                    <form.Field
                        name="phone"
                        validators={{
                            onBlur: createPhoneSchema(),
                        }}
                    >
                        {(field) => (
                            <div className="space-y-2">
                                <label htmlFor={field.name} className="text-sm font-medium uppercase tracking-wider text-text-muted">
                                    {m.contact_form_phone()}
                                </label>
                                <motion.input
                                    type="tel"
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onChange={(e) => {
                                        setSubmitStatus(null)
                                        field.handleChange(e.target.value)
                                    }}
                                    onBlur={field.handleBlur}
                                    className={`w-full rounded-xl border bg-[#0a0a0a] px-4 py-4 text-white transition-colors focus:border-accent focus:outline-none ${
                                        field.state.meta.isTouched && field.state.meta.errors.length > 0
                                            ? 'border-red-500'
                                            : 'border-border'
                                    }`}
                                    placeholder={m.contact_form_phone_placeholder()}
                                    whileFocus={{ scale: 1.01 }}
                                    transition={{ duration: 0.2, ease: smoothEase }}
                                />
                                <FieldError field={field} />
                            </div>
                        )}
                    </form.Field>

                    <form.Field
                        name="message"
                        validators={{
                            onBlur: createMessageSchema(),
                        }}
                    >
                        {(field) => (
                            <div className="space-y-2">
                                <label htmlFor={field.name} className="text-sm font-medium uppercase tracking-wider text-text-muted">
                                    {m.contact_form_message()}
                                </label>
                                <motion.textarea
                                    id={field.name}
                                    name={field.name}
                                    rows={5}
                                    value={field.state.value}
                                    onChange={(e) => {
                                        setSubmitStatus(null)
                                        field.handleChange(e.target.value)
                                    }}
                                    onBlur={field.handleBlur}
                                    className={`w-full resize-none rounded-xl border bg-[#0a0a0a] px-4 py-4 text-white transition-colors focus:border-accent focus:outline-none ${
                                        field.state.meta.isTouched && field.state.meta.errors.length > 0
                                            ? 'border-red-500'
                                            : 'border-border'
                                    }`}
                                    placeholder={m.contact_form_message_placeholder()}
                                    whileFocus={{ scale: 1.01 }}
                                    transition={{ duration: 0.2, ease: smoothEase }}
                                />
                                <FieldError field={field} />
                            </div>
                        )}
                    </form.Field>

                    <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
                        {([canSubmit, isSubmitting]) => (
                            <motion.button
                                type="submit"
                                disabled={!canSubmit || isSubmitting}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-4 font-bold text-black transition-all hover:bg-accent hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
                                whileHover={{ scale: canSubmit && !isSubmitting ? 1.02 : 1 }}
                                whileTap={{ scale: canSubmit && !isSubmitting ? 0.98 : 1 }}
                                transition={{ duration: 0.2, ease: smoothEase }}
                            >
                                {isSubmitting ? (
                                    <motion.span
                                        className="h-5 w-5 rounded-full border-2 border-current border-t-transparent"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                        aria-label="Submitting..."
                                    />
                                ) : (
                                    <>
                                        {m.contact_form_submit()} <Send size={18} />
                                    </>
                                )}
                            </motion.button>
                        )}
                    </form.Subscribe>
                </form>
            </div>
        </FadeIn>
    )
}
