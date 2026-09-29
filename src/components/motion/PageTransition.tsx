import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useBlocker, useLocation, useRouter } from '@tanstack/react-router'
import type { ShouldBlockFn } from '@tanstack/react-router'
import type { RouteLabel } from '@/components/motion/routeLabels'
import { announce, setAppInert } from '@/components/motion/a11y'
import { GlyphReels } from '@/components/motion/GlyphReels'
import { spinGlyphReels } from '@/components/motion/reels'
import { routeLabel } from '@/components/motion/routeLabels'
import { GLYPH_WORDS } from '@/components/ui/glyphWords'
import { EASE_IN_OUT_QUART, EASE_OUT_EXPO, afterNextPaint, eventElement, prefersReducedMotion, wait } from '@/lib/motion/env'
import { coverPage, registerCoverRequest, revealPage } from '@/lib/motion/pageCover'
import { syncSmoothScroll } from '@/lib/motion/smoothScroll'
import { applyInkPadding, inkPadding, riseDistance } from '@/lib/motion/textMask'
import { SITE } from '@/lib/site'

type Phase = 'idle' | 'covering' | 'covered' | 'revealing'

/** If the new route never renders (an error, a cancelled navigation), lift the curtain anyway. */
const RENDER_TIMEOUT_MS = 4000
const HIDDEN_CLIP = 'inset(100% 0% 0% 0%)'
const FULL_CLIP = 'inset(0% 0% 0% 0%)'
const GONE_CLIP = 'inset(0% 0% 100% 0%)'

/** Motion loads with the motion runtime (after hydration); the first navigation awaits it if it is not there yet. */
const loadAnimate = () => import('@/lib/motion/motionCore').then((motion) => motion.animate)

/**
 * Grow the label's mask to the font's ink (Czech accents such as the ring of Ů reach above the 0.9 line box) and
 * return how far the label must travel to be fully hidden below (entering) or above (leaving) it.
 */
function titleRise(title: HTMLElement): number {
    const mask = title.parentElement
    const padding = inkPadding(title)
    if (mask) applyInkPadding(mask, padding)
    return riseDistance(title.offsetHeight, padding)
}

function focusNewPage() {
    document.getElementById('main-content')?.focus({ preventScroll: true })
    // The router updates <title> in the same commit; read it on the next frame.
    requestAnimationFrame(() => announce(document.title))
}

/**
 * Route curtain: an ink panel (with a coral leading edge) wipes up over the page, shows the destination's index and
 * name over spinning glyph reels, holds while the router swaps the page underneath, then wipes away while the new
 * page's entrances play.
 *
 * Integration: a TanStack Router blocker whose async `shouldBlockFn` plays the cover and then lets the navigation
 * through, so links, `router.navigate` and back/forward all hold the old page until it is covered. Hash-only and
 * search-only changes pass straight through. Reduced motion: no curtain at all, just focus and announcement.
 * After every page change focus moves to `<main>` and the new title is announced.
 */
export function PageTransition() {
    const router = useRouter()
    const rootRef = useRef<HTMLDivElement>(null)
    const phase = useRef<Phase>('idle')
    const pendingHash = useRef('')
    const pathname = useLocation({ select: (location) => location.pathname })
    const [label, setLabel] = useState<RouteLabel>(() => routeLabel(pathname))

    const layers = useCallback(() => {
        const root = rootRef.current
        return {
            root,
            accent: root?.querySelector<HTMLElement>('[data-curtain-accent]') ?? null,
            panel: root?.querySelector<HTMLElement>('[data-curtain-panel]') ?? null,
            title: root?.querySelector<HTMLElement>('[data-curtain-title]') ?? null,
        }
    }, [])

    const cover = useCallback(
        async (next: RouteLabel) => {
            const { root, accent, panel, title } = layers()
            if (!root || !accent || !panel || !title) return
            phase.current = 'covering'
            const animate = await loadAnimate()
            flushSync(() => setLabel(next))
            root.dataset.state = 'covering'
            syncSmoothScroll()
            spinGlyphReels(root)
            const rise = titleRise(title)
            const wipe = { duration: 0.6, ease: EASE_IN_OUT_QUART }
            await Promise.all([
                animate(accent, { clipPath: [HIDDEN_CLIP, FULL_CLIP] }, wipe),
                animate(panel, { clipPath: [HIDDEN_CLIP, FULL_CLIP] }, { ...wipe, delay: 0.08 }),
                animate(
                    title,
                    { transform: [`translateY(${rise}px)`, 'translateY(0px)'] },
                    { duration: 0.8, ease: EASE_OUT_EXPO, delay: 0.3 },
                ),
            ])
            coverPage()
            setAppInert(true)
            phase.current = 'covered'
            root.dataset.state = 'covered'
        },
        [layers],
    )

    const reveal = useCallback(async () => {
        const { root, accent, panel, title } = layers()
        if (!root || !accent || !panel || !title || phase.current === 'revealing' || phase.current === 'idle') return
        phase.current = 'revealing'
        root.dataset.state = 'revealing'
        const animate = await loadAnimate()
        await document.fonts.ready
        await afterNextPaint()
        setAppInert(false)
        focusNewPage()
        const wipe = { duration: 0.75, ease: EASE_IN_OUT_QUART }
        const exit = Promise.all([
            animate(
                title,
                { transform: ['translateY(0px)', `translateY(${-titleRise(title)}px)`] },
                { duration: 0.45, ease: EASE_IN_OUT_QUART },
            ),
            animate(panel, { clipPath: [FULL_CLIP, GONE_CLIP] }, { ...wipe, delay: 0.12 }),
            animate(accent, { clipPath: [FULL_CLIP, GONE_CLIP] }, { ...wipe, delay: 0.2 }),
        ])
        await wait(300)
        revealPage()
        await exit
        for (const layer of [accent, panel, title]) {
            layer.style.removeProperty('clip-path')
            layer.style.removeProperty('transform')
        }
        delete document.documentElement.dataset.cover
        delete root.dataset.state
        phase.current = 'idle'
    }, [layers])

    const shouldBlockFn = useCallback<ShouldBlockFn>(
        async ({ current, next }) => {
            if (current.pathname === next.pathname || phase.current !== 'idle' || prefersReducedMotion()) return false
            await cover(routeLabel(next.pathname, pendingHash.current))
            pendingHash.current = ''
            // The navigation now proceeds; `onRendered` lifts the curtain (or the timeout does).
            setTimeout(() => {
                if (phase.current === 'covered') void reveal()
            }, RENDER_TIMEOUT_MS)
            return false
        },
        [cover, reveal],
    )

    useBlocker({ shouldBlockFn, enableBeforeUnload: false })

    useEffect(() => {
        // Remember the hash of the link being followed (the blocker only sees the path), for the "Co stavím" label.
        const onClick = (event: MouseEvent) => {
            const anchor = eventElement(event)?.closest('a[href]')
            pendingHash.current = anchor instanceof HTMLAnchorElement ? anchor.hash.replace('#', '') : ''
        }
        document.addEventListener('click', onClick, true)

        const unsubscribe = router.subscribe('onRendered', (event) => {
            if (phase.current === 'covered') void reveal()
            else if (event.pathChanged && phase.current === 'idle' && event.fromLocation) focusNewPage()
        })

        // Arrived from a language switch: the document starts covered; lift the curtain once the page is ready.
        const html = document.documentElement
        if (html.dataset.cover === 'arrive') {
            html.dataset.cover = 'run'
            phase.current = 'covered'
            setAppInert(true)
            void reveal()
        }

        // Back/forward cache restore of a page that was left under the curtain (language switch): clear it.
        const onPageShow = (event: PageTransitionEvent) => {
            if (!event.persisted) return
            const root = rootRef.current
            if (!root) return
            delete root.dataset.state
            for (const layer of root.querySelectorAll<HTMLElement>('[data-curtain-accent], [data-curtain-panel], [data-curtain-title]')) {
                layer.style.removeProperty('clip-path')
                layer.style.removeProperty('transform')
            }
            setAppInert(false)
            revealPage()
            phase.current = 'idle'
        }
        window.addEventListener('pageshow', onPageShow)

        const unregisterCover = registerCoverRequest(cover)
        return () => {
            unregisterCover()
            unsubscribe()
            document.removeEventListener('click', onClick, true)
            window.removeEventListener('pageshow', onPageShow)
        }
    }, [router, cover, reveal])

    return (
        <div ref={rootRef} className="curtain" aria-hidden="true">
            <div data-curtain-accent className="curtain-layer bg-coral" />
            <div data-curtain-panel className="curtain-layer bg-grain-dark text-paper">
                <div className="container-page flex h-full flex-col justify-between py-6 lg:py-10">
                    <div className="flex items-start justify-between gap-6 font-mono text-label text-on-dark uppercase">
                        <span>{SITE.name}</span>
                        <GlyphReels glyphs={GLYPH_WORDS.eyebrow} className="text-[1.25rem] text-on-dark-label" />
                    </div>
                    <div className="flex flex-col gap-3 pb-[8vh] lg:gap-5">
                        <span className="font-mono text-[clamp(1.75rem,3vw,3rem)] leading-none font-medium text-on-dark-label">
                            {label.index}
                        </span>
                        <span data-curtain-mask className="reveal-mask block">
                            <span
                                data-curtain-title
                                className="block font-display text-[clamp(3.25rem,11vw,11rem)] leading-[0.9] font-black tracking-[-0.045em] break-words text-paper uppercase"
                            >
                                {label.title}
                            </span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}
