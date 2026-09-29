/**
 * Masks that text rises through (split headlines, the footer name, the route curtain's label) must never cut glyph
 * ink. With the design's tight display line heights (0.88–0.96) Czech accents (Ů, Ý, Ž, Č, Ř, Ě, Ď, Ť…) reach above
 * the line box and descenders (j, p, y, g, q, commas) below it, so a mask the size of the line box slices them.
 *
 * `inkPadding` measures, for the element's exact computed font, how far the ink of a reference set of every tall
 * and deep glyph (plus the element's own text) extends beyond the element's line box. `applyInkPadding` grows the
 * mask by that much (padding) and cancels it for layout (an equal negative margin), so nothing moves.
 */

/** Tall and deep glyphs of Czech and English: the ink box of this set bounds any heading we render. */
const REFERENCE_INK = 'ÁČĎÉĚÍŇÓŘŠŤÚŮÝŽÅÄÖÜáčďéěíňóřšťúůýžjpqgyQ,;()'
/** Extra room beyond the measured ink (anti-aliasing, rounding), as a share of the font size. */
const SAFETY_EM = 0.06

export interface InkPadding {
    top: number
    bottom: number
}

let context: CanvasRenderingContext2D | null = null

export function inkPadding(element: Element, text = element.textContent): InkPadding {
    const style = getComputedStyle(element)
    const size = Number.parseFloat(style.fontSize) || 16
    context ??= document.createElement('canvas').getContext('2d')
    if (!context) return { top: 0.4 * size, bottom: 0.3 * size }
    context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
    const shown = style.textTransform === 'uppercase' ? text.toUpperCase() : text
    const metrics = context.measureText(`${REFERENCE_INK}${shown}`)
    // The line box: the font's content area (its ascent + descent) centred in the line height (half-leading).
    const content = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent
    const lineHeight = style.lineHeight === 'normal' ? content : Number.parseFloat(style.lineHeight)
    const baseline = (lineHeight - content) / 2 + metrics.fontBoundingBoxAscent
    const safety = SAFETY_EM * size
    return {
        top: Math.max(0, metrics.actualBoundingBoxAscent - baseline) + safety,
        bottom: Math.max(0, metrics.actualBoundingBoxDescent - (lineHeight - baseline)) + safety,
    }
}

/** Grow a mask by the ink padding without changing layout. Returns the undo. */
export function applyInkPadding(mask: HTMLElement, padding: InkPadding): () => void {
    mask.style.paddingTop = `${padding.top}px`
    mask.style.marginTop = `${-padding.top}px`
    mask.style.paddingBottom = `${padding.bottom}px`
    mask.style.marginBottom = `${-padding.bottom}px`
    return () => {
        for (const property of ['padding-top', 'margin-top', 'padding-bottom', 'margin-bottom']) mask.style.removeProperty(property)
    }
}

/**
 * How far a piece of height `height` must start below its resting place so that, tilted by `tiltDeg` around its
 * bottom-left corner and `width` wide, none of its ink shows in a mask padded by `padding`.
 */
export function riseDistance(height: number, padding: InkPadding, width = 0, tiltDeg = 0): number {
    const lift = width * Math.sin((Math.abs(tiltDeg) * Math.PI) / 180)
    return Math.ceil(height + padding.top + padding.bottom + lift + 1)
}
