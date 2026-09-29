import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface FormFieldBaseProps {
    /** Control id; also used to derive the label, description and error ids. */
    id: string
    label: ReactNode
    /** Decorative type annotation shown at the right of the label row, e.g. "string", "string?", "text". */
    typeHint?: string
    /** Helper text rendered under the control and linked via aria-describedby. */
    description?: ReactNode
    /** Error message; marks the control `aria-invalid` and links it via aria-describedby. */
    error?: ReactNode
    className?: string
}

type InputFieldProps = FormFieldBaseProps & { multiline?: false } & Omit<ComponentProps<'input'>, 'id' | 'className'>
type TextareaFieldProps = FormFieldBaseProps & { multiline: true } & Omit<ComponentProps<'textarea'>, 'id' | 'className'>

export type FormFieldProps = InputFieldProps | TextareaFieldProps

const CONTROL_CLASS =
    'w-full rounded-lg border-[1.5px] border-line-dark-strong bg-white/3 px-4 text-body-sm text-paper transition-colors duration-200 placeholder:text-on-dark-muted hover:border-on-dark-muted focus:border-on-dark-label focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-dark-label aria-invalid:border-coral disabled:cursor-not-allowed disabled:opacity-60'

function describedBy(...ids: Array<string | false | undefined>) {
    const value = ids.filter(Boolean).join(' ')
    return value.length > 0 ? value : undefined
}

/**
 * Form Field (ink surfaces) — mono label row with a type hint, a 52px input (or 150px textarea),
 * optional description and error. Presentational: state and validation stay with the form.
 */
export function FormField(props: FormFieldProps) {
    const { id, label, typeHint, description, error, className } = props
    const descriptionId = description ? `${id}-description` : undefined
    const errorId = error ? `${id}-error` : undefined
    const hasError = Boolean(error)

    let control: ReactNode
    if (props.multiline) {
        const {
            id: _id,
            label: _label,
            typeHint: _typeHint,
            description: _description,
            error: _error,
            className: _className,
            multiline: _multiline,
            ...textareaProps
        } = props
        control = (
            <textarea
                {...textareaProps}
                id={id}
                aria-invalid={hasError || undefined}
                aria-describedby={describedBy(textareaProps['aria-describedby'], descriptionId, errorId)}
                className={cn(CONTROL_CLASS, 'min-h-[150px] resize-y py-3')}
            />
        )
    } else {
        const {
            id: _id,
            label: _label,
            typeHint: _typeHint,
            description: _description,
            error: _error,
            className: _className,
            multiline: _multiline,
            ...inputProps
        } = props
        control = (
            <input
                {...inputProps}
                id={id}
                aria-invalid={hasError || undefined}
                aria-describedby={describedBy(inputProps['aria-describedby'], descriptionId, errorId)}
                className={cn(CONTROL_CLASS, 'h-13')}
            />
        )
    }

    return (
        <div className={cn('flex flex-col gap-2', className)}>
            <div className="flex items-baseline justify-between gap-4">
                <label htmlFor={id} className="font-mono text-label text-on-dark-label uppercase">
                    {label}
                </label>
                {typeHint ? (
                    <span aria-hidden="true" className="font-mono text-code tracking-[0.025rem] text-on-dark-muted">
                        {typeHint}
                    </span>
                ) : null}
            </div>
            {control}
            {description ? (
                <p id={descriptionId} className="text-body-sm text-on-dark-muted">
                    {description}
                </p>
            ) : null}
            {error ? (
                <p id={errorId} className="text-body-sm text-coral">
                    {error}
                </p>
            ) : null}
        </div>
    )
}
