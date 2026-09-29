import { cn } from '@/lib/utils'

interface StatProps {
    /** Small code above the number, e.g. "S.01". */
    code: string
    value: string
    label: string
    /** Full 1.5px ink outline for a standalone stat. Off by default: grids draw their own rules via className (border color is ink). */
    bordered?: boolean
    className?: string
}

/** Stat — mono code, big display number (88 → 56), mono label. */
export function Stat({ code, value, label, bordered = false, className }: StatProps) {
    return (
        <div
            className={cn(
                'flex flex-col gap-2.5 border-ink px-4 pt-[18px] pb-5 lg:gap-3.5 lg:px-7 lg:pt-7 lg:pb-8',
                bordered ? 'border-[1.5px]' : null,
                className,
            )}
        >
            <p className="font-mono text-label font-normal text-ink-soft">{code}</p>
            <p className="font-display text-stat text-ink">{value}</p>
            <p className="font-mono text-label leading-[1.4] font-semibold text-ink uppercase">{label}</p>
        </div>
    )
}
