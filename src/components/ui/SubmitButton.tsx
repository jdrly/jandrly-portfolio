import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Button } from '@/components/ui/Button'

interface SubmitButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'children'> {
    children: ReactNode
    /** While true the button is disabled, announces `aria-busy` and shows `pendingLabel` if provided. */
    isPending?: boolean
    pendingLabel?: ReactNode
}

/** Button / Submit — full-width coral form submit with arrow. */
export function SubmitButton({ children, isPending = false, pendingLabel, disabled, ...props }: SubmitButtonProps) {
    return (
        <Button type="submit" variant="submit" disabled={disabled || isPending} aria-busy={isPending || undefined} {...props}>
            {isPending && pendingLabel !== undefined ? pendingLabel : children}
        </Button>
    )
}
