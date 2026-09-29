import { cn } from '@/lib/utils'

interface TechCellProps {
    /** Mono index, e.g. "T.01". */
    index: string
    name: string
    /** Full 1.5px ink outline for a standalone cell. Off by default: grids draw their own rules via className (border color is ink). */
    bordered?: boolean
    className?: string
}

/** Tech Cell — index top-left, technology name bottom-left (400×136 → 175×96). */
export function TechCell({ index, name, bordered = false, className }: TechCellProps) {
    return (
        <div
            className={cn(
                'flex min-h-[clamp(6rem,3.8095vw+5.0714rem,8.5rem)] flex-col justify-between gap-3 border-ink px-4 pt-3.5 pb-4 lg:px-7 lg:pt-[22px] lg:pb-[26px]',
                bordered ? 'border-[1.5px]' : null,
                className,
            )}
        >
            <p className="font-mono text-label text-tan">{index}</p>
            <p className="font-display text-cell text-ink">{name}</p>
        </div>
    )
}
