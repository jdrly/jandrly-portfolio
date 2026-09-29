import { STAR_PATH } from '@/components/ui/Sparkles'
import { cn } from '@/lib/utils'

type StarOrnamentVariant = 'default' | 'inner-ring' | 'compact'

interface StarOrnamentGeometry {
    /** Outer ring diameter = viewBox size, in px. */
    box: number
    /** Star size, in px (centered). */
    star: number
    /** Inner ring diameter, in px. */
    innerRing?: number
    /** Default rendered size. */
    sizeClass: string
}

/*
 * Proportions from the design nodes: `default` — Star Ornament component (150px ring, 80px star);
 * `inner-ring` — Services hero (240px ring, 140px inner ring, 120px star); `compact` — Services hero mobile
 * (64px ring, 36px star).
 */
const VARIANTS: Record<StarOrnamentVariant, StarOrnamentGeometry> = {
    default: { box: 150, star: 80, sizeClass: 'size-[150px]' },
    'inner-ring': { box: 240, star: 120, innerRing: 140, sizeClass: 'size-60' },
    compact: { box: 64, star: 36, sizeClass: 'size-16' },
}

const RULE = 1.5

interface StarOrnamentProps {
    variant?: StarOrnamentVariant
    /** Size (defaults to the variant's design size) and color (defaults to tan) — strokes and fills follow `currentColor`. */
    className?: string
}

/** Compass-like ornament: ring, crosshair and a four-point star (optionally an inner ring). Decorative only. */
export function StarOrnament({ variant = 'default', className }: StarOrnamentProps) {
    const { box, star, innerRing, sizeClass } = VARIANTS[variant]
    const center = box / 2
    const starOffset = (box - star) / 2

    return (
        <svg aria-hidden="true" focusable="false" viewBox={`0 0 ${box} ${box}`} className={cn('shrink-0 text-tan', sizeClass, className)}>
            <circle
                cx={center}
                cy={center}
                r={center - RULE / 2}
                fill="none"
                stroke="currentColor"
                strokeWidth={RULE}
                vectorEffect="non-scaling-stroke"
            />
            {innerRing ? (
                <circle
                    cx={center}
                    cy={center}
                    r={innerRing / 2 - 0.5}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                />
            ) : null}
            <rect x="0" y={center - RULE / 2} width={box} height={RULE} fill="currentColor" />
            <rect x={center - RULE / 2} y="0" width={RULE} height={box} fill="currentColor" />
            <path d={STAR_PATH} transform={`translate(${starOffset} ${starOffset}) scale(${star / 100})`} fill="currentColor" />
        </svg>
    )
}
