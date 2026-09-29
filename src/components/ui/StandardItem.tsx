import { cn } from '@/lib/utils'

interface StandardItemProps {
    /** Mono code, e.g. "S.01". */
    code: string
    title: string
    description: string
    headingLevel?: 'h3' | 'h4'
    className?: string
}

/** Standard Item — dot + code, title, description (collaboration standards list). */
export function StandardItem({ code, title, description, headingLevel: Heading = 'h3', className }: StandardItemProps) {
    return (
        <div className={cn('flex flex-col gap-2 lg:gap-3', className)}>
            <p className="flex items-center gap-3 font-mono text-label-lg text-ink lg:gap-3.5">
                <span aria-hidden="true" className="size-[9px] shrink-0 rounded-full bg-ink lg:size-2.5" />
                {code}
            </p>
            <Heading className="text-h6 text-ink">{title}</Heading>
            <p className="text-body-sm text-ink-soft">{description}</p>
        </div>
    )
}
