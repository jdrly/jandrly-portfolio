import { animate } from 'motion'
import { getTypewriterDelay, scrambleText } from 'motion-plus'
import type { InkPadding } from '@/lib/motion/textMask'
import { GLYPH_PATHS } from '@/components/ui/glyphPaths'
import { EASE_OUT_EXPO, SCRAMBLE_CHARS } from '@/lib/motion/env'
import { applyInkPadding, inkPadding } from '@/lib/motion/textMask'

/**
 * Text effects (split, scramble, typewriter, count-up, glyph decode).
 *
 * Accessibility and React safety: the element's original child nodes are set aside and restored untouched when the
 * effect ends, so React keeps owning the same text nodes. While the effect runs, screen readers get the real text
 * from a visually hidden copy and the animated copy is `aria-hidden`.
 */

interface TextSwap {
    /** The animated, aria-hidden copy. */
    visual: HTMLSpanElement
    text: string
    restore: () => void
}

export function swapInVisualCopy(element: HTMLElement, visualClassName = ''): TextSwap {
    const original = Array.from(element.childNodes)
    const text = element.textContent
    const visual = document.createElement('span')
    visual.setAttribute('aria-hidden', 'true')
    if (visualClassName) visual.className = visualClassName
    visual.textContent = text

    // Inside an already hidden subtree (decorative lines) a screen reader copy would be noise.
    if (element.closest('[aria-hidden="true"]')) {
        element.replaceChildren(visual)
    } else {
        const readable = document.createElement('span')
        readable.className = 'sr-only'
        readable.textContent = text
        element.replaceChildren(readable, visual)
    }

    let restored = false
    return {
        visual,
        text,
        restore: () => {
            if (restored) return
            restored = true
            element.replaceChildren(...original)
        },
    }
}

export interface SplitResult {
    chars: Array<HTMLSpanElement>
    words: Array<HTMLSpanElement>
    lines: Array<HTMLSpanElement>
    /** How far the masks extend beyond the line box (the font's ink overflow, see textMask.ts). */
    padding: InkPadding
    restore: () => void
}

/** Word separators (not the no-break space, which keeps its words together). */
const WORD_PATTERN = /[^ \t\n\r\f]+/g

/** Where a word sits in the original text, so its (and its characters') rendered position can be read back. */
interface SourceWord {
    text: string
    node: Text
    start: number
}

/** The element's words grouped into lines exactly as the browser has laid them out (read only, via Range rects). */
function measureLines(element: HTMLElement): Array<Array<SourceWord>> {
    const lines: Array<{ top: number; words: Array<SourceWord> }> = []
    const range = document.createRange()
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
    for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
        for (const match of node.data.matchAll(WORD_PATTERN)) {
            range.setStart(node, match.index)
            range.setEnd(node, match.index + match[0].length)
            const rect = range.getClientRects()[0] as DOMRect | undefined
            if (!rect) continue
            const word = { text: match[0], node, start: match.index }
            const line = lines.at(-1)
            if (line && Math.abs(line.top - rect.top) < 2) line.words.push(word)
            else lines.push({ top: rect.top, words: [word] })
        }
    }
    return lines.map((line) => line.words)
}

/** First client rect of a text range. */
function textRect(node: Text, start: number, end: number): DOMRect | undefined {
    const range = document.createRange()
    range.setStart(node, start)
    range.setEnd(node, end)
    return range.getClientRects()[0]
}

function span(className: string, text?: string): HTMLSpanElement {
    const element = document.createElement('span')
    element.className = className
    if (text !== undefined) element.textContent = text
    return element
}

interface Piece {
    element: HTMLSpanElement
    /** The same text in the original: where the piece must end up. */
    source: { node: Text; start: number; end: number }
}

/**
 * Put every overlay piece exactly where its text is rendered in the original. Split pieces are laid out on their
 * own, so they lose the kerning between them (Archivo kerns "LÝ", "/D", "AN"…) and drift by fractions of a pixel
 * per pair; left alone, the letters would snap back when the original text returns. Text rects on both sides (not
 * box rects), all reads before all writes; `position: relative` offsets never affect layout.
 */
function alignToSource(pieces: Array<Piece>) {
    const offsets = pieces.map(({ element, source }) => {
        const target = textRect(source.node, source.start, source.end)
        const text = element.firstChild
        const current = text instanceof Text ? textRect(text, 0, text.length) : undefined
        return target && current ? { dx: target.left - current.left, dy: target.top - current.top } : null
    })
    pieces.forEach(({ element }, index) => {
        const offset = offsets[index]
        if (!offset || (Math.abs(offset.dx) < 0.01 && Math.abs(offset.dy) < 0.01)) return
        element.style.position = 'relative'
        element.style.left = `${offset.dx}px`
        element.style.top = `${offset.dy}px`
    })
}

/**
 * Split an element's text for a masked reveal without touching its layout.
 *
 * The original text stays in place, untouched (React keeps its nodes) and readable by assistive tech, only made
 * transparent; the animated copy is an aria-hidden overlay on top of it, built from the lines exactly as they are
 * rendered, and every piece is aligned to its own glyphs in the original (kerning included). Nothing in the flow
 * changes size, so nothing around it can move, and when the original returns nothing snaps.
 * `mask`: `line` (words rise out of their line) or `word` (characters rise out of their word).
 */
export function splitIntoSpans(
    element: HTMLElement,
    { chars = false, mask = 'line' }: { chars?: boolean; mask?: 'line' | 'word' } = {},
): SplitResult {
    const lines = measureLines(element)
    const style = getComputedStyle(element)
    const overlay = span('reveal-overlay')
    overlay.setAttribute('aria-hidden', 'true')
    overlay.style.color = style.color

    const result: SplitResult = { chars: [], words: [], lines: [], padding: { top: 0, bottom: 0 }, restore: () => undefined }
    const pieces: Array<Piece> = []
    for (const words of lines) {
        const line = span(mask === 'line' ? 'reveal-line reveal-mask' : 'reveal-line')
        words.forEach((word, index) => {
            if (index > 0) line.append(' ')
            const wordSpan = span(mask === 'word' ? 'reveal-word reveal-mask' : 'reveal-word')
            if (chars) {
                let offset = word.start
                for (const char of Array.from(word.text)) {
                    const charSpan = span('reveal-char', char)
                    wordSpan.append(charSpan)
                    result.chars.push(charSpan)
                    pieces.push({ element: charSpan, source: { node: word.node, start: offset, end: offset + char.length } })
                    offset += char.length
                }
            } else {
                wordSpan.textContent = word.text
                pieces.push({ element: wordSpan, source: { node: word.node, start: word.start, end: word.start + word.text.length } })
            }
            line.append(wordSpan)
            result.words.push(wordSpan)
        })
        overlay.append(line)
        result.lines.push(line)
    }

    const position = element.style.position
    if (style.position === 'static') element.style.position = 'relative'
    element.style.color = 'transparent'
    element.append(overlay)
    // Masks as tall as the font's ink, not the line box: accents and descenders are never cut.
    result.padding = inkPadding(element)
    for (const maskElement of overlay.querySelectorAll<HTMLElement>('.reveal-mask')) applyInkPadding(maskElement, result.padding)
    alignToSource(pieces)

    result.restore = () => {
        overlay.remove()
        element.style.removeProperty('color')
        element.style.position = position
    }
    return result
}

/**
 * Resolves once the web font the element is set in is loaded (measuring with the fallback would place the pieces
 * by the fallback's metrics). Never waits longer than `timeout`.
 */
export function elementFontReady(element: HTMLElement, timeout = 1500): Promise<void> {
    const style = getComputedStyle(element)
    const font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
    return Promise.race([
        document.fonts.load(font, element.textContent || 'A').then(
            () => undefined,
            () => undefined,
        ),
        new Promise<void>((resolve) => setTimeout(resolve, timeout)),
    ]).then(() => document.fonts.ready.then(() => undefined))
}

/** Motion+ `scrambleText` on an aria-hidden copy; the original text returns when every character has settled. */
export function scrambleIn(
    element: HTMLElement,
    { delay = 0, perChar = 0.03, base = 0.28 }: { delay?: number; perChar?: number; base?: number } = {},
): Promise<void> {
    const swap = swapInVisualCopy(element)
    const length = swap.text.length
    const controls = scrambleText(swap.visual, {
        chars: SCRAMBLE_CHARS,
        interval: 0.04,
        delay,
        duration: (index: number) => base + index * perChar,
    })
    // Hard stop in case the tab is hidden (timers are throttled) or the text is very long.
    const guard = setTimeout(() => controls.finish(), (delay + base + length * perChar) * 1000 + 1500)
    return controls.finished.then(() => {
        clearTimeout(guard)
        swap.restore()
    })
}

const CARET = '▌'

/**
 * Typewriter for the monospaced "pseudo-SQL" lines. The server renders the full line (it is content, and it must
 * be there without JavaScript); the effect empties an aria-hidden copy and types it back with Motion+'s natural
 * per-character timing. The line keeps its height meanwhile, so nothing below moves.
 */
export function typeIn(element: HTMLElement, { delay = 0, interval = 26 }: { delay?: number; interval?: number } = {}): Promise<void> {
    // Layout height, fractional: offsetHeight rounds (which adds up over several lines), and a bounding rect would
    // include the transforms of a still-animating ancestor (a tilted box is taller).
    const computed = Number.parseFloat(getComputedStyle(element).height)
    const height = Number.isFinite(computed) ? computed : element.offsetHeight
    const swap = swapInVisualCopy(element)
    // Exact height (not only a minimum): the caret glyph may come from a fallback font with a taller line box.
    element.style.height = `${height}px`
    // The caret is part of the typed text (a block glyph), not a box of its own: nothing moves but the text itself.
    const typed = document.createTextNode(CARET)
    swap.visual.replaceChildren(typed)
    let length = 0

    return new Promise((resolve) => {
        const finish = () => {
            swap.restore()
            element.style.removeProperty('height')
            resolve()
        }
        const step = () => {
            if (length >= swap.text.length) {
                setTimeout(finish, 220)
                return
            }
            length += 1
            const current = swap.text.slice(0, length)
            typed.data = current + CARET
            setTimeout(step, getTypewriterDelay(swap.text, current, interval, 'natural', 0.2))
        }
        setTimeout(step, delay * 1000)
    })
}

/** Count a number up from zero (stats). The server renders the final value; the count runs on an aria-hidden copy. */
export function countUp(element: HTMLElement, { delay = 0 }: { delay?: number } = {}): Promise<void> {
    const swap = swapInVisualCopy(element)
    const target = Number.parseInt(swap.text, 10)
    if (!Number.isFinite(target)) {
        swap.restore()
        return Promise.resolve()
    }
    swap.visual.textContent = '0'
    return animate(0, target, {
        delay,
        duration: 1.1 + Math.min(target, 40) * 0.02,
        ease: EASE_OUT_EXPO,
        onUpdate: (value) => {
            swap.visual.textContent = String(Math.round(value))
        },
    }).then(() => swap.restore())
}

const decoding = new WeakSet<Element>()

function randomGlyphPath(): string {
    return GLYPH_PATHS[Math.floor(Math.random() * GLYPH_PATHS.length)]
}

/**
 * Glyph decode: every glyph of a GlyphWord flickers through random glyphs, then locks to its own one, left to right.
 * Discrete path swaps on tiny SVGs (no interpolation), capped at ~16 swaps per second.
 */
export function decodeGlyphs(word: Element, { delay = 0, settle = 0.22, perGlyph = 0.07 } = {}): Promise<void> {
    if (decoding.has(word)) return Promise.resolve()
    const paths = Array.from(word.querySelectorAll<SVGPathElement>('svg[data-glyph] path'))
    if (paths.length === 0) return Promise.resolve()
    decoding.add(word)
    const finals = paths.map((path) => path.getAttribute('d') ?? '')
    const start = performance.now() + delay * 1000

    return new Promise((resolve) => {
        const timer = setInterval(() => {
            const elapsed = (performance.now() - start) / 1000
            if (elapsed < 0) return
            let done = 0
            for (let index = 0; index < paths.length; index++) {
                if (elapsed >= settle + index * perGlyph) {
                    paths[index].setAttribute('d', finals[index])
                    done++
                } else {
                    paths[index].setAttribute('d', randomGlyphPath())
                }
            }
            if (done === paths.length) {
                clearInterval(timer)
                decoding.delete(word)
                resolve()
            }
        }, 60)
    })
}
