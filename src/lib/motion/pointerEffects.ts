import { animate, frame, motionValue } from 'motion'
import type { MotionValue } from 'motion'
import { eventElement, hasFinePointer, prefersReducedMotion } from '@/lib/motion/env'
import { decodeGlyphs, scrambleIn } from '@/lib/motion/textEffects'

/**
 * Hover interactions for fine pointers (delegated, one listener each):
 *  - entering a link, button or `[data-hover-group]` scrambles its `[data-scramble-hover]` mono labels and decodes
 *    its glyph words;
 *  - `[data-magnetic]` elements lean towards the pointer on a spring (`[data-magnetic-inner]` leans further).
 * Touch, keyboard and reduced motion get the plain CSS hover styles only.
 */

const HOVER_TRIGGER = 'a, button, [data-hover-group]'
const scrambling = new WeakSet<Element>()

function onPointerOver(event: PointerEvent) {
    if (event.pointerType !== 'mouse' || prefersReducedMotion()) return
    const trigger = eventElement(event)?.closest(HOVER_TRIGGER)
    if (!trigger) return
    const from = event.relatedTarget as Node | null
    if (from && trigger.contains(from)) return

    for (const label of trigger.querySelectorAll<HTMLElement>('[data-scramble-hover]')) {
        if (scrambling.has(label)) continue
        scrambling.add(label)
        void scrambleIn(label, { perChar: 0.022 }).finally(() => scrambling.delete(label))
    }
    for (const word of trigger.querySelectorAll('[data-glyph-word]')) {
        void decodeGlyphs(word, { settle: 0.12, perGlyph: 0.05 })
    }
}

// ---------------------------------------------------------------------------------------------------------------
// Magnetic

const PULL = 0.28
const INNER_PULL = 0.16
const MAX_PULL = 18
const SPRING = { type: 'spring', stiffness: 260, damping: 18, mass: 0.7 } as const

interface Magnet {
    x: MotionValue<number>
    y: MotionValue<number>
    inner: HTMLElement | null
    render: () => void
}

const magnets = new WeakMap<HTMLElement, Magnet>()
let active: HTMLElement | null = null

function magnetFor(element: HTMLElement): Magnet {
    let magnet = magnets.get(element)
    if (magnet) return magnet
    const x = motionValue(0)
    const y = motionValue(0)
    const inner = element.querySelector<HTMLElement>('[data-magnetic-inner]')
    // 2D translations rounded to device pixels: no forced compositor layer (translate3d would create one) and no
    // re-rasterised label when the button settles back.
    const dpr = window.devicePixelRatio || 1
    const round = (value: number) => Math.round(value * dpr) / dpr
    const render = () => {
        const dx = round(x.get())
        const dy = round(y.get())
        const settled = dx === 0 && dy === 0
        element.style.transform = settled ? '' : `translate(${dx}px, ${dy}px)`
        const ix = round(dx * INNER_PULL * 2)
        const iy = round(dy * INNER_PULL * 2)
        if (inner) inner.style.transform = ix === 0 && iy === 0 ? '' : `translate(${ix}px, ${iy}px)`
    }
    x.on('change', () => frame.render(render))
    y.on('change', () => frame.render(render))
    magnet = { x, y, inner, render }
    magnets.set(element, magnet)
    return magnet
}

function clampPull(value: number) {
    return Math.max(-MAX_PULL, Math.min(MAX_PULL, value))
}

function release(element: HTMLElement) {
    const magnet = magnetFor(element)
    animate(magnet.x, 0, SPRING)
    animate(magnet.y, 0, SPRING)
}

function onPointerMove(event: PointerEvent) {
    if (event.pointerType !== 'mouse') return
    const target = eventElement(event)?.closest<HTMLElement>('[data-magnetic]') ?? null
    if (active && active !== target) {
        release(active)
        active = null
    }
    if (!target || prefersReducedMotion() || target.matches(':disabled, [aria-disabled="true"]')) return
    active = target
    const magnet = magnetFor(target)
    // Measure without the current pull, so the pull does not feed back into itself.
    const rect = target.getBoundingClientRect()
    const centerX = rect.left - magnet.x.get() + rect.width / 2
    const centerY = rect.top - magnet.y.get() + rect.height / 2
    animate(magnet.x, clampPull((event.clientX - centerX) * PULL), SPRING)
    animate(magnet.y, clampPull((event.clientY - centerY) * PULL), SPRING)
}

function onPointerLeaveDocument() {
    if (active) release(active)
    active = null
}

/** Install the delegated listeners; returns the cleanup. */
export function initPointerEffects(): () => void {
    if (!hasFinePointer()) return () => undefined
    document.addEventListener('pointerover', onPointerOver, { passive: true })
    document.addEventListener('pointermove', onPointerMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onPointerLeaveDocument)
    return () => {
        document.removeEventListener('pointerover', onPointerOver)
        document.removeEventListener('pointermove', onPointerMove)
        document.documentElement.removeEventListener('pointerleave', onPointerLeaveDocument)
    }
}
