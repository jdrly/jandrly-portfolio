import type { BrandIconData, BrandIconShape } from '@/lib/socialLinks'

interface BrandIconProps {
    icon: BrandIconData
    className?: string
}

function BrandIconShapeElement({ shape }: { shape: BrandIconShape }) {
    switch (shape.kind) {
        case 'path':
            return <path d={shape.d} />
        case 'rect':
            return <rect x={shape.x} y={shape.y} width={shape.width} height={shape.height} />
        case 'circle':
            return <circle cx={shape.cx} cy={shape.cy} r={shape.r} />
    }
}

/** Outline brand icon (Lucide style); decorative — pair it with a visible or accessible label. */
export function BrandIcon({ icon, className = 'h-5 w-5' }: BrandIconProps) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            {icon.shapes.map((shape, index) => (
                <BrandIconShapeElement key={index} shape={shape} />
            ))}
        </svg>
    )
}
