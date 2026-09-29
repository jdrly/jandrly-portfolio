import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ContactDetailRowProps {
    icon: LucideIcon
    /** Key label, e.g. "E-mail" (rendered uppercase). */
    label: string
    value: string
    /** Makes the value a link (mailto:, tel:, …). */
    href?: string
    className?: string
}

/**
 * Contact Detail Row — ruled row with icon + mono key and a bold value.
 * Desktop: key column (200px) and value side by side; mobile: stacked.
 */
export function ContactDetailRow({ icon: Icon, label, value, href, className }: ContactDetailRowProps) {
    return (
        <div
            className={cn(
                'flex flex-col gap-1.5 border-t-[1.5px] border-ink py-3.5 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:py-[18px]',
                className,
            )}
        >
            <p className="flex items-center gap-2.5 font-mono text-label font-semibold text-ink-soft uppercase lg:w-[200px] lg:shrink-0 lg:gap-3">
                <Icon aria-hidden="true" className="size-4 shrink-0 text-teal-ink lg:size-[18px]" />
                {label}
            </p>
            <p className="font-display text-value text-ink">
                {href ? (
                    <a
                        href={href}
                        className="underline decoration-transparent decoration-[1.5px] underline-offset-4 transition-colors hover:decoration-current"
                    >
                        {value}
                    </a>
                ) : (
                    value
                )}
            </p>
        </div>
    )
}
