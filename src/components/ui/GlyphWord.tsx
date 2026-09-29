import { GLYPH_PATHS, SLASH_PATH } from '@/components/ui/glyphPaths'
import { cn } from '@/lib/utils'

export type GlyphId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | '/'

interface GlyphWordProps {
    glyphs: ReadonlyArray<GlyphId>
    /** Glyph size follows the font-size (1em); set it with a `text-[…]` class. Color follows `currentColor`. */
    className?: string
    /** Decode the glyphs (cycle through random glyphs, then settle) when the word scrolls or curtains into view. */
    reveal?: boolean
}

/** `data-glyph-word` also opts the word into the decode-on-hover effect of its link or card (src/lib/motion). */
export function GlyphWord({ glyphs, className, reveal = true }: GlyphWordProps) {
    return (
        <span
            aria-hidden="true"
            data-glyph-word=""
            data-reveal={reveal ? 'glyphs' : undefined}
            className={cn('inline-flex shrink-0 items-center gap-[0.32em] leading-none', className)}
        >
            {glyphs.map((glyph, index) =>
                glyph === '/' ? (
                    <svg key={index} viewBox="30 0 40 100" className="h-[1em] w-[0.55em] shrink-0 fill-current" focusable="false">
                        <path d={SLASH_PATH} />
                    </svg>
                ) : (
                    <svg
                        key={index}
                        data-glyph={glyph}
                        viewBox="0 0 100 100"
                        className="size-[1em] shrink-0 fill-current"
                        focusable="false"
                    >
                        <path d={GLYPH_PATHS[glyph]} />
                    </svg>
                ),
            )}
        </span>
    )
}
