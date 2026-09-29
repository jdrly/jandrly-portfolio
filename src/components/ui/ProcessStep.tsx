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
            data-step=""
            className={cn(
                'relative flex flex-col gap-2.5 border-l-2 border-line-dark pl-5 lg:gap-[18px] lg:border-t-2 lg:border-l-0 lg:border-on-dark-label lg:pt-6 lg:pl-0',
                className,
            )}
        >
            {/* Desktop: the scroll-linked fill, drawn exactly over this step's own top rule (the border). */}
            <span
                aria-hidden="true"
                data-scroll="step-fill"
                className="pointer-events-none absolute inset-x-0 -top-0.5 hidden h-0.5 scale-x-0 bg-on-dark-label lg:block"
            />
            <div className="flex items-center justify-between">
                <span data-step-number="" className="font-mono text-index-lg font-semibold text-on-dark-label lg:font-medium">
                    {number}
                </span>
                <span aria-hidden="true" data-step-dot="" className="hidden size-3 rounded-full bg-on-dark-label lg:block" />
            </div>
            <div className="flex flex-col gap-2 lg:gap-[18px]">
                <Heading className="text-h5 text-paper">{title}</Heading>
                <p className="text-body-sm text-on-dark">{description}</p>
            </div>
        </Component>
    )
}
