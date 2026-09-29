import type { ReactNode } from 'react'
import type { GlyphId } from '@/components/ui/GlyphWord'
import { GlyphWord } from '@/components/ui/GlyphWord'
import { GLYPH_WORDS } from '@/components/ui/glyphWords'
import { cn } from '@/lib/utils'

type EyebrowTone = 'tan' | 'teal' | 'on-dark'

const TONE_CLASS: Record<EyebrowTone, string> = {
    tan: 'text-tan',
    teal: 'text-teal-ink',
    'on-dark': 'text-on-dark-label',
}

interface EyebrowProps {
    /** Section label, e.g. "[02] Služby" (rendered uppercase). */
    children: ReactNode
    /** Decorative glyph sequence; pass `null` to hide it. */
    glyphs?: ReadonlyArray<GlyphId> | null
    /** `tan` on paper sections, `teal` in page heroes, `on-dark` on ink sections. */
    tone?: EyebrowTone
    /** Use a heading element when the eyebrow is the only visible title of a section. */
    as?: 'p' | 'span' | 'div' | 'h2' | 'h3'
    className?: string
}

/** Mono section label + rule + glyph word. 13px/64px rule on desktop → 12px/32px rule on mobile. */
export function Eyebrow({ children, glyphs = GLYPH_WORDS.eyebrow, tone = 'tan', as: Component = 'p', className }: EyebrowProps) {
    return (
        <Component className={cn('flex items-center gap-[clamp(0.75rem,0.381vw+0.6571rem,1rem)]', TONE_CLASS[tone], className)}>
            <span data-reveal="scramble" className="font-mono text-label uppercase">
                {children}
            </span>
            <span aria-hidden="true" data-reveal="rule" className="h-[1.5px] w-[clamp(2rem,3.0476vw+1.2571rem,4rem)] shrink-0 bg-current" />
            {glyphs ? <GlyphWord glyphs={glyphs} className="gap-[0.31em] text-[clamp(0.8125rem,0.1905vw+0.7661rem,0.9375rem)]" /> : null}
        </Component>
    )
}
