import { animate, scroll, stagger } from 'motion'
import type { DOMKeyframesDefinition } from 'motion'
import { prefersReducedMotion } from '@/lib/motion/env'
import { isPageCovered } from '@/lib/motion/pageCover'
import { applyInkPadding, inkPadding, riseDistance } from '@/lib/motion/textMask'

/**
 * Scroll-linked effects, declared with `data-scroll="<kind>"`. Motion's `scroll()` scrubs a transform animation with
 * the scroll position (native ScrollTimeline where the browser has it), so they cost no layout.
 *
 * Rules, so that nothing ever collides or comes apart:
 *  - An element that shares an edge or border with a neighbour never moves on its own (the hero panel frame and
 *    the name plate, service rows, cards): either the whole ornament moves as one unit, or nothing does.
 *  - Sideways movement stays inside the element's own box, measured at bind time (and again on resize).
 *  - Every effect comes to rest in the element's natural state once it reaches its reading position.
 *
 * Kinds whose value at the top of the page equals the element's natural state are always bound. The others would
 * jump when bound while on screen, so they are bound only under a cover or while the element is off screen; they
 * are re-bound after every route render and on resize.
 */

interface Motion {
    keyframes: DOMKeyframesDefinition
    times?: Array<number>
}

interface ScrollKind {
    /** The scrubbed animation; `null` skips the element (nothing to animate at this size). */
    motion?: (element: HTMLElement) => Motion | null
    target?: (element: HTMLElement) => Element | null
    offset: Array<string>
    /** Starting state equals the natural state at scroll 0: safe to bind while on screen. */
    safeOnScreen?: boolean
    /** Animate these descendants instead of the element (staggered along the scroll range). */
    items?: (element: HTMLElement) => Array<HTMLElement>
    staggerStep?: number
    transformOrigin?: (element: HTMLElement) => string
    /** Extra setup (attributes) while bound; returns the undo. */
    setup?: (element: HTMLElement) => () => void
}

const heroSection = (element: HTMLElement) => element.closest('section')
const scrollRoot = (element: HTMLElement) => element.closest('[data-scroll-root]') ?? element

/** Longest horizontal slide of a heading, as a share of the viewport width. */
const MAX_DRIFT = 0.12
/** Below this much free room a slide would not read as movement: leave the heading still. */
const MIN_DRIFT_PX = 16

/**
 * Free room between the right end of an element's longest text line and the right edge of its own content box.
 * Sliding within it can never reach neighbouring content (it is outside the box) or the viewport edge. Rect
 * differences, so a transform currently applied to the element cancels out.
 */
function freeRoomRight(element: HTMLElement): number {
    const box = element.getBoundingClientRect()
    const style = getComputedStyle(element)
    const contentRight = box.right - Number.parseFloat(style.paddingRight) - Number.parseFloat(style.borderRightWidth)
    // Text nodes only (element boxes such as a running split overlay's line blocks span the whole width).
    const range = document.createRange()
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
    let textRight = Number.NEGATIVE_INFINITY
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (node.parentElement?.closest('.reveal-overlay')) continue
        range.selectNodeContents(node)
        for (const rect of range.getClientRects()) textRight = Math.max(textRight, rect.right)
    }
    return Number.isFinite(textRight) ? Math.max(0, contentRight - textRight) : 0
}

function stepIndex(element: HTMLElement): { index: number; count: number } {
    const steps = Array.from(scrollRoot(element).querySelectorAll('[data-step]'))
    const step = element.closest('[data-step]')
    return { index: step ? steps.indexOf(step) : 0, count: Math.max(1, steps.length) }
}

const isVertical = (element: HTMLElement) => element.dataset.axis === 'y'

const KINDS: Partial<Record<string, ScrollKind>> = {
    // Home hero: the portrait sinks and grows inside its own clipped box while the hero scrolls away (origin bottom:
    // no gap opens at the top). Nothing borders it, so it may move alone.
    portrait: {
        motion: () => ({ keyframes: { transform: ['translateY(0%) scale(1)', 'translateY(14%) scale(1.16)'] } }),
        target: heroSection,
        offset: ['start start', 'end start'],
        safeOnScreen: true,
        transformOrigin: () => '50% 100%',
    },
    // Big section headings slide in from the right, within their own box, and settle before the reading position.
    drift: {
        motion: (element) => {
            const distance = Math.min(freeRoomRight(element), window.innerWidth * MAX_DRIFT)
            if (distance < MIN_DRIFT_PX) return null
            return { keyframes: { transform: [`translateX(${Math.round(distance)}px)`, 'translateX(0px)'] } }
        },
        offset: ['start end', 'start 40%'],
    },
    // Compass ornaments (ring, crosshair and star as one unit) turn with the scroll and settle upright mid-screen.
    spin: {
        motion: () => ({ keyframes: { transform: ['rotate(-180deg)', 'rotate(0deg)'] } }),
        offset: ['start end', 'center center'],
    },
    // Footer "JAN DRLÝ": each letter rises out of the name's mask as the footer is reached. The mask is as tall as the
    // font's ink (the Ý accent reaches above the tight line box) and the letters start fully below it.
    'rise-chars': {
        motion: (element) => {
            const chars = Array.from(element.querySelectorAll<HTMLElement>('[data-char]'))
            const height = Math.max(0, ...chars.map((char) => char.offsetHeight))
            const width = Math.max(0, ...chars.map((char) => char.offsetWidth))
            const distance = riseDistance(height, inkPadding(element), width, 8)
            return { keyframes: { transform: [`translateY(${distance}px) rotate(8deg)`, 'translateY(0px) rotate(0deg)'] } }
        },
        items: (element) => Array.from(element.querySelectorAll<HTMLElement>('[data-char]')),
        staggerStep: 0.07,
        offset: ['start end', 'end end'],
        transformOrigin: () => '0% 100%',
        setup: (element) => applyInkPadding(element, inkPadding(element)),
    },
    // Services process: each step's own rule fills in turn (its share of the section's scroll range), drawn exactly
    // over the static rule, so at rest the rules are the design's.
    'step-fill': {
        motion: (element) => {
            const { index, count } = stepIndex(element)
            const [from, to] = isVertical(element) ? ['scaleY(0)', 'scaleY(1)'] : ['scaleX(0)', 'scaleX(1)']
            return { keyframes: { transform: [from, from, to, to] }, times: [0, index / count, (index + 1) / count, 1] }
        },
        target: scrollRoot,
        offset: ['start 75%', 'end 60%'],
        transformOrigin: (element) => (isVertical(element) ? '50% 0%' : '0% 50%'),
    },
    // …and the steps light up as their rule passes 35 %.
    steps: {
        target: scrollRoot,
        offset: ['start 75%', 'end 60%'],
        setup: (element) => trackSteps(element),
    },
}

/** Mark the `[data-step]` items active once the fill passes them (their share of the range). */
function trackSteps(root: HTMLElement): () => void {
    const steps = Array.from(root.querySelectorAll<HTMLElement>('[data-step]'))
    if (steps.length === 0) return () => undefined
    root.setAttribute('data-scroll-active', '')
    const stop = scroll(
        (progress: number) => {
            for (let index = 0; index < steps.length; index++) {
                const active = progress >= (index + 0.35) / steps.length
                if (active !== steps[index].hasAttribute('data-active')) steps[index].toggleAttribute('data-active', active)
            }
        },
        { target: root, offset: ['start 75%', 'end 60%'] },
    )
    return () => {
        stop()
        root.removeAttribute('data-scroll-active')
        for (const step of steps) step.removeAttribute('data-active')
    }
}

function isOnScreen(element: Element): boolean {
    const rect = element.getBoundingClientRect()
    return rect.bottom > 0 && rect.top < window.innerHeight
}

interface Plan {
    element: HTMLElement
    kind: ScrollKind
    target: Element
    motion: Motion | null
    transformOrigin: string
}

/** Read phase: decide what to bind (and measure it) without writing anything. */
function planOne(element: HTMLElement): Plan | null {
    const kind = KINDS[element.dataset.scroll ?? '']
    if (!kind) return null
    // Responsive variants that are not displayed at this size (the mobile / desktop process rules).
    if (element.getClientRects().length === 0) return null
    const target = kind.target?.(element) ?? element
    if (!kind.safeOnScreen && !isPageCovered() && isOnScreen(target)) return null
    const motion = kind.motion ? kind.motion(element) : null
    if (kind.motion && !motion) return null
    return { element, kind, target, motion, transformOrigin: kind.transformOrigin?.(element) ?? '' }
}

const cleanups = new Map<HTMLElement, () => void>()

/** Write phase. */
function bindOne({ element, kind, target, motion, transformOrigin }: Plan) {
    const items = kind.items?.(element) ?? [element]
    let stop: (() => void) | undefined
    if (motion) {
        if (transformOrigin) for (const item of items) item.style.transformOrigin = transformOrigin
        const animation = animate(items, motion.keyframes, {
            ease: 'linear',
            duration: 1,
            times: motion.times,
            delay: kind.staggerStep ? stagger(kind.staggerStep) : 0,
        })
        const stopScroll = scroll(animation, { target, offset: kind.offset as never })
        stop = () => {
            stopScroll()
            animation.stop()
        }
    }
    const undoSetup = kind.setup?.(element)

    cleanups.set(element, () => {
        stop?.()
        undoSetup?.()
        if (!motion) return
        for (const item of items) {
            item.style.removeProperty('transform')
            item.style.removeProperty('transform-origin')
        }
    })
}

export function unbindScrollEffects(): void {
    for (const cleanup of cleanups.values()) cleanup()
    cleanups.clear()
}

/** (Re)bind every `[data-scroll]` element: all measurements first, then all writes. */
export function bindScrollEffects(root: ParentNode = document): void {
    const plans = prefersReducedMotion()
        ? []
        : Array.from(root.querySelectorAll<HTMLElement>('[data-scroll]'), planOne).filter((plan): plan is Plan => plan !== null)
    unbindScrollEffects()
    for (const plan of plans) bindOne(plan)
}
