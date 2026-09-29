import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type ArrowLinkTone = 'ink' | 'on-dark'

interface ArrowLinkProps {
    /** Internal page; localized by the router rewrite, rendered as a real crawlable `href`. */
    to: '/about' | '/services' | '/contact'
    tone?: ArrowLinkTone
    /** Rise in when it scrolls into view. */
    reveal?: boolean
    className?: string
    children: ReactNode
}

const TONE_CLASS: Record<ArrowLinkTone, string> = {
    ink: 'text-ink hover:text-teal-ink',
    'on-dark': 'text-paper hover:text-on-dark-label',
}

/** Underlined mono text link with an arrow: in-content links between pages, lighter than a button. */
export function ArrowLink({ to, tone = 'ink', reveal = false, className, children }: ArrowLinkProps) {
    return (
        <Link
            to={to}
            data-reveal={reveal ? 'fade-up' : undefined}
            className={cn(
                'group inline-flex w-fit items-center gap-2 font-mono text-label font-semibold uppercase underline decoration-[1.5px] underline-offset-4 transition-colors duration-200',
                TONE_CLASS[tone],
                className,
            )}
        >
            <span data-scramble-hover="">{children}</span>
            <ArrowRight
                aria-hidden="true"
                className="size-4 shrink-0 transition-transform duration-200 ease-out-soft group-hover:translate-x-0.5"
            />
        </Link>
    )
}
