import { cn } from '@/lib/utils'

interface ProcessStepProps {
    /** Two-digit step number, e.g. "01". */
    number: string
    title: string
    description: string
    /** Use `li` inside an `<ol>` of steps. */
    as?: 'div' | 'li'
    headingLevel?: 'h3' | 'h4'
    className?: string
}

/**
 * Process Step (ink sections). Desktop: teal top rule, 56px number + dot, title, text.
 * Mobile: left rule timeline, 26px number, no dot.
 */
export function ProcessStep({
    number,
    title,
    description,
    as: Component = 'div',
    headingLevel: Heading = 'h3',
    className,
}: ProcessStepProps) {
    return (
        <Component
            className={cn(
                'flex flex-col gap-2.5 border-l-2 border-line-dark pl-5 lg:gap-[18px] lg:border-t-2 lg:border-l-0 lg:border-on-dark-label lg:pt-6 lg:pl-0',
                className,
            )}
        >
            <div className="flex items-center justify-between">
                <span className="font-mono text-index-lg font-semibold text-on-dark-label lg:font-medium">{number}</span>
                <span aria-hidden="true" className="hidden size-3 rounded-full bg-on-dark-label lg:block" />
            </div>
            <div className="flex flex-col gap-2 lg:gap-[18px]">
                <Heading className="text-h5 text-paper">{title}</Heading>
                <p className="text-body-sm text-on-dark">{description}</p>
            </div>
        </Component>
    )
}
