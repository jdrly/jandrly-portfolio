import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CodeTagProps {
    /** Short code, e.g. "WEB.APP" (rendered uppercase). */
    children: ReactNode
    className?: string
}

/** Outlined mono tag with the design's clipped corners (top-left + bottom-right radius). Scrambles on hover of its row. */
export function CodeTag({ children, className }: CodeTagProps) {
    return (
        <span
            data-scramble-hover=""
            className={cn(
                'inline-flex shrink-0 items-center justify-center rounded-tl-[7px] rounded-br-[7px] border-[1.5px] border-ink px-2.5 py-1.5 font-mono text-label text-ink uppercase lg:rounded-tl-lg lg:rounded-br-lg lg:px-3 lg:py-2',
                className,
            )}
        >
            {children}
        </span>
    )
}
