/**
 * Page cover state, shared by the intro, the route curtain and the reveal engine.
 *
 * While the page is covered (intro loader, route curtain, or the "arrive" curtain after a language switch), the
 * content underneath is invisible, so entrance animations may put it into its hidden start state. `revealPage()`
 * fires when the cover starts to lift; everything that is in view then animates in.
 */

import type { RouteLabel } from '@/components/motion/routeLabels'
import { prefersReducedMotion } from '@/lib/motion/env'

type Listener = () => void
type CoverRequest = (label: RouteLabel) => Promise<void>

/** sessionStorage flag read by the head script (src/lib/motion/bootScript.ts): the next document starts covered. */
export const ARRIVE_KEY = 'jd-arrive'

/** Set by the mounted route curtain (PageTransition); null when it isn't mounted. */
let requestCover: CoverRequest | null = null

export function registerCoverRequest(request: CoverRequest): () => void {
    requestCover = request
    return () => {
        if (requestCover === request) requestCover = null
    }
}

/**
 * Cover the page with the curtain before a full document navigation (the language switch), then navigate. The new
 * document starts covered (`html[data-cover="arrive"]`, set by the head script) and lifts the curtain itself.
 * Returns false when there is no curtain (reduced motion, not mounted) and the caller should navigate normally.
 */
export function coverThenNavigate(label: RouteLabel, href: string): boolean {
    if (!requestCover || prefersReducedMotion()) return false
    try {
        sessionStorage.setItem(ARRIVE_KEY, '1')
    } catch {
        return false
    }
    void requestCover(label).then(() => window.location.assign(href))
    return true
}

const listeners = new Set<Listener>()
let covered = false

/** Initial load: the head script marks the document when an intro or arrive curtain is up. */
if (typeof document !== 'undefined') {
    const { intro, cover } = document.documentElement.dataset
    covered = intro !== undefined || cover !== undefined
}

export function isPageCovered(): boolean {
    return covered
}

export function coverPage(): void {
    covered = true
}

export function revealPage(): void {
    if (!covered) return
    covered = false
    for (const listener of [...listeners]) listener()
}

export function onPageReveal(listener: Listener): () => void {
    listeners.add(listener)
    return () => {
        listeners.delete(listener)
    }
}
