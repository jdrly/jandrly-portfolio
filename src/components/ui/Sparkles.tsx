import { cn } from '@/lib/utils'

/** Four-point star used by Sparkles and Star Ornament (100×100 viewBox). */
export const STAR_PATH = 'M50 0c4 38 12 46 50 50-38 4-46 12-50 50-4-38-12-46-50-50 38-4 46-12 50-50z'

type SparklesVariant = 'tilted' | 'level'

interface SparklesProps {
    /** `tilted` = component default (stars rotated +12°/−8°), `level` = footer version. */
    variant?: SparklesVariant
    /** Width sets the size (height follows the aspect ratio); color follows `currentColor`. */
    className?: string
}

/*
 * Transforms mirror the design nodes: each star is a 100×100 path scaled into its frame; the design rotates
 * counter-clockwise around the node's top-left corner, which is a negative SVG rotation.
 */
const VARIANTS: Record<SparklesVariant, { viewBox: string; stars: ReadonlyArray<string>; className: string }> = {
    tilted: {
        viewBox: '0 0 130 64',
        stars: ['translate(0 14) rotate(-12) scale(0.7 0.44)', 'translate(58 0) rotate(8) scale(0.72 0.56)'],
        className: 'w-[130px] text-teal',
    },
    level: {
        viewBox: '0 0 90 44',
        stars: ['translate(0 10) scale(0.48 0.3)', 'translate(40 0) scale(0.5 0.4)'],
        className: 'w-[90px] text-on-dark-label',
    },
}

export function Sparkles({ variant = 'tilted', className }: SparklesProps) {
    const config = VARIANTS[variant]

    return (
        <svg
            aria-hidden="true"
            focusable="false"
            viewBox={config.viewBox}
            overflow="visible"
            className={cn('h-auto shrink-0 fill-current', config.className, className)}
        >
            {config.stars.map((transform) => (
                <path key={transform} d={STAR_PATH} transform={transform} />
            ))}
        </svg>
    )
}
