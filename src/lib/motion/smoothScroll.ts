import type Lenis from 'lenis'
import type { FrameData } from 'motion'
import { prefersReducedMotion } from '@/lib/motion/env'

/**
 * The single app-wide Lenis instance. It smooths wheel input only: keyboard scrolling, find-in-page, touch and
 * programmatic `scrollTo` stay native, and Lenis re-syncs from the native `scroll` event. It scrolls the window
 * itself (no transformed wrapper), so `position: sticky` and scroll-driven animations keep working.
 *
 * Driven by Motion's frame loop (not its own rAF), so scroll values and Motion animations update in the same frame.
 * Lenis and Motion load lazily with the motion runtime; the pause/scroll helpers below are safe to call before
 * (they no-op or fall back to native scrolling).
 */
let lenis: Lenis | null = null
let stopFrameLoop: (() => void) | null = null
let starting = false
let stopCount = 0

export async function startSmoothScroll(): Promise<void> {
    if (lenis || starting || prefersReducedMotion()) return
    starting = true
    try {
        const [{ default: LenisClass }, { frame, cancelFrame }] = await Promise.all([import('lenis'), import('@/lib/motion/motionCore')])
        if (prefersReducedMotion()) return
        const instance = new LenisClass({ autoRaf: false, anchors: false, lerp: 0.11, respectReducedMotion: true })
        const tick = (data: FrameData) => instance.raf(data.timestamp)
        frame.update(tick, true)
        stopFrameLoop = () => cancelFrame(tick)
        lenis = instance
        if (stopCount > 0) instance.stop()
    } finally {
        starting = false
    }
}

export function destroySmoothScroll(): void {
    stopFrameLoop?.()
    stopFrameLoop = null
    lenis?.destroy()
    lenis = null
}

/** Pause smooth scrolling (the mobile menu dialog locks the page). Calls nest; returns the resume. */
export function pauseSmoothScroll(): () => void {
    stopCount += 1
    lenis?.stop()
    let released = false
    return () => {
        if (released) return
        released = true
        stopCount = Math.max(0, stopCount - 1)
        if (stopCount === 0) lenis?.start()
    }
}

/** Drop any in-flight smooth scroll and adopt the current native position (before route changes). */
export function syncSmoothScroll(): void {
    if (!lenis || stopCount > 0) return
    // `start()` after `stop()` resets Lenis to the native position; same task, so nothing renders in between.
    lenis.stop()
    lenis.start()
}

/** Distance from the viewport top an anchored section should stop at (its `scroll-margin-top`). */
function scrollMarginTop(element: Element): number {
    return Number.parseFloat(getComputedStyle(element).scrollMarginTop) || 0
}

/** Scroll to an element: smooth through Lenis when allowed, otherwise a native (instant or smooth) jump. */
export function scrollToElement(element: HTMLElement, { immediate = false }: { immediate?: boolean } = {}): void {
    if (lenis && !immediate) {
        // Lenis honours `scroll-margin-top` itself. `force`: a link in the closing mobile menu may still hold the pause.
        lenis.scrollTo(element, { duration: 1.3, easing: (t) => 1 - Math.pow(1 - t, 4), force: true })
        return
    }
    const top = element.getBoundingClientRect().top + window.scrollY - scrollMarginTop(element)
    // Lenis (if running) re-syncs from the native scroll event.
    window.scrollTo({ top, behavior: immediate || prefersReducedMotion() ? 'instant' : 'smooth' })
}
