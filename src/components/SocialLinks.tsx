import type { BrandIconData } from '@/lib/socialLinks'

interface BrandIconProps {
    icon: BrandIconData
    className?: string
}

export function BrandIcon({ icon, className = 'h-5 w-5' }: BrandIconProps) {
    return (
        <svg className={className} role="img" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
            <path d={icon.path} />
        </svg>
    )
}
