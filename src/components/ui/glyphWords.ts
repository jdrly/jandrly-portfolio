import type { GlyphId } from '@/components/ui/GlyphWord'

/** Glyph sequences used by the design's components. */
export const GLYPH_WORDS = {
    /** "JAN / DRLÝ" — name plate, footer */
    name: [0, 1, '/', 2, 3, 4, 5],
    /** Eyebrow ornament */
    eyebrow: [6, 7, 8, 9],
    /** Service rows */
    service: [10, 11, 2],
    /** Case cards */
    case: [3, 0, 4, 6],
} as const satisfies Record<string, ReadonlyArray<GlyphId>>
