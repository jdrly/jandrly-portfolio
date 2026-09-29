import type { GlyphId } from '@/components/ui/GlyphWord'
import { GLYPH_PATHS, SLASH_PATH } from '@/components/ui/glyphPaths'
import { cn } from '@/lib/utils'

const SYMBOL_PREFIX = 'glyph-symbol-'

/** One hidden sprite with the 14 glyphs, referenced by every reel cell (`<use>`), so the reels stay light markup. */
export function GlyphSymbols() {
    return (
        <svg aria-hidden="true" focusable="false" width="0" height="0" className="absolute size-0 overflow-hidden">
            <defs>
                {GLYPH_PATHS.map((path, index) => (
                    <symbol key={path} id={`${SYMBOL_PREFIX}${index}`} viewBox="0 0 100 100">
                        <path d={path} />
                    </symbol>
                ))}
            </defs>
        </svg>
    )
}

/** Fixed shuffle of the 14 glyph ids; each reel starts at a different offset, so neighbours never flip in sync. */
const REEL_ORDER = [7, 2, 11, 4, 13, 0, 9, 5, 12, 1, 8, 3, 10, 6] as const

function reelOrder(reelIndex: number): ReadonlyArray<number> {
    const offset = (reelIndex * 5) % REEL_ORDER.length
    return [...REEL_ORDER.slice(offset), ...REEL_ORDER.slice(0, offset)]
}

interface GlyphReelsProps {
    /** The glyph word the reels settle on. */
    glyphs: ReadonlyArray<GlyphId>
    className?: string
}

/**
 * Slot-machine glyph reels: each cell is a vertical strip of all 14 glyphs, stepped through by a CSS animation
 * (`transform` only, runs before hydration). `settleGlyphReels()` stops them on the target glyphs.
 */
export function GlyphReels({ glyphs, className }: GlyphReelsProps) {
    return (
        <span aria-hidden="true" className={cn('inline-flex items-center gap-[0.28em] leading-none', className)}>
            {glyphs.map((glyph, reelIndex) =>
                glyph === '/' ? (
                    <svg key={reelIndex} viewBox="30 0 40 100" className="h-[1em] w-[0.55em] shrink-0 fill-current" focusable="false">
                        <path d={SLASH_PATH} />
                    </svg>
                ) : (
                    <span key={reelIndex} className="glyph-reel-window">
                        {/* One SVG strip per reel: the 14 glyphs stacked 100 units apart, 1em each. */}
                        <svg
                            viewBox={`0 0 100 ${REEL_ORDER.length * 100}`}
                            className="glyph-reel h-[14em] w-[1em] fill-current"
                            focusable="false"
                            data-reel-target={reelOrder(reelIndex).indexOf(glyph)}
                        >
                            {reelOrder(reelIndex).map((id, slot) => (
                                <use key={id} href={`#${SYMBOL_PREFIX}${id}`} y={slot * 100} width="100" height="100" />
                            ))}
                        </svg>
                    </span>
                ),
            )}
        </span>
    )
}
