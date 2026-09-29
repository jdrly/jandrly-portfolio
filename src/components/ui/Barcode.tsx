import { BARCODE_PATTERNS } from '@/components/ui/barcodePatterns'
import { cn } from '@/lib/utils'

interface BarcodeProps {
    bars?: ReadonlyArray<number>
    /** Gap between bars, in the same px units as `bars`. */
    gap?: number
    /** Bar height in px. Together with the bar widths it defines the intrinsic aspect ratio. */
    height?: number
    /** Size and color. Defaults to the design's 173×40 ink barcode; color follows `currentColor`. */
    className?: string
}

/** Decorative barcode, drawn as one SVG so arbitrary bar widths need no inline styles. Its bars print in on reveal. */
export function Barcode({ bars = BARCODE_PATTERNS.default, gap = 4, height = 40, className }: BarcodeProps) {
    const width = bars.reduce((sum, bar) => sum + bar, 0) + gap * (bars.length - 1)
    const offsets = bars.map((_, index) => bars.slice(0, index).reduce((sum, bar) => sum + bar + gap, 0))

    return (
        <svg
            aria-hidden="true"
            focusable="false"
            viewBox={`0 0 ${width} ${height}`}
            width={width}
            height={height}
            preserveAspectRatio="none"
            data-reveal="bars"
            className={cn('shrink-0 fill-current text-ink', className)}
        >
            {bars.map((bar, index) => (
                <rect key={index} x={offsets[index]} y={0} width={bar} height={height} />
            ))}
        </svg>
    )
}
