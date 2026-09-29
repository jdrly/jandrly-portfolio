import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { SITE } from '@/lib/site'
import * as m from '@/paraglide/messages'

interface WordmarkProps {
    onNavigate?: () => void
    className?: string
}

/** "JANDRLÝ" wordmark with its underline rule; links home. 30px on desktop → 24px on mobile. */
export function Wordmark({ onNavigate, className }: WordmarkProps) {
    return (
        <Link
            to="/"
            onClick={onNavigate}
            aria-label={`${SITE.name} · ${m.nav_home()}`}
            className={cn('inline-flex flex-col items-end gap-[3px] text-ink lg:gap-1', className)}
        >
            <span className="font-display text-[clamp(1.5rem,0.5714vw+1.3607rem,1.875rem)] leading-none font-black tracking-[-0.033em]">
                JANDRLÝ
            </span>
            <span aria-hidden="true" className="h-0.5 w-[calc(100%-2px)] bg-current lg:h-[2.5px]" />
        </Link>
    )
}
