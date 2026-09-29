import { GlyphWord } from '@/components/ui/GlyphWord'
import { GLYPH_WORDS } from '@/components/ui/glyphWords'
import { cn } from '@/lib/utils'

interface GlyphNameProps {
    className?: string
}

/** Large "JAN / DRLÝ" glyph-script ornament (64px glyphs on desktop → 36px on mobile). Decorative only. */
export function GlyphName({ className }: GlyphNameProps) {
    return (
        <GlyphWord
            glyphs={GLYPH_WORDS.name}
            className={cn('gap-[0.28em] text-[clamp(2.25rem,2.6667vw+1.6rem,4rem)] text-ink', className)}
        />
    )
}
