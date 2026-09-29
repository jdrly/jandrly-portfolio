import type { BrandIconData } from '@/lib/socialLinks'
import { BrandIcon } from '@/components/SocialLinks'
import { cn } from '@/lib/utils'
import * as m from '@/paraglide/messages'

interface SocialChipProps {
    href: string
    label: string
    icon: BrandIconData
    className?: string
}

/** Chip / Social — outlined external link with brand icon. Stretches when its parent gives it `flex-1`. */
export function SocialChip({ href, label, icon, className }: SocialChipProps) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
                'inline-flex items-center justify-center gap-1.5 rounded-tl-[10px] rounded-br-[10px] border-[1.5px] border-ink px-3 py-3 font-mono text-label font-semibold tracking-[0.0125rem] text-ink uppercase transition-colors duration-200 hover:bg-ink hover:text-paper lg:gap-2.5 lg:px-[18px] lg:tracking-[0.0625rem]',
                className,
            )}
        >
            <BrandIcon icon={icon} className="size-4 shrink-0 lg:size-[18px]" />
            {label}
            <span className="sr-only"> {m.opens_in_new_tab()}</span>
        </a>
    )
}
