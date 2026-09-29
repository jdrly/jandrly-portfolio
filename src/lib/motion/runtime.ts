import type { AnyRouter } from '@tanstack/react-router'
import { APP_ROOT_ID } from '@/components/motion/a11y'
import { REDUCED_MOTION_QUERY, eventElement } from '@/lib/motion/env'
import { isPageCovered } from '@/lib/motion/pageCover'
import { initPointerEffects } from '@/lib/motion/pointerEffects'
import { bindReveals, revealAllNow } from '@/lib/motion/reveal'
import { bindScrollEffects, unbindScrollEffects } from '@/lib/motion/scrollEffects'
import { destroySmoothScroll, scrollToElement, startSmoothScroll } from '@/lib/motion/smoothScroll'

function appRoot(): ParentNode {
    return document.getElementById(APP_ROOT_ID) ?? document
}

/**
 * The client motion runtime: Lenis smooth scrolling, the `data-reveal` / `data-scroll` engines, hover effects and
 * hash scrolling. Loaded lazily after hydration (MotionRuntime.tsx), so none of it weighs on the first render.
 * Re-binds after every route render. Everything switches off, and hidden content shows at once, if the visitor
 * turns on reduced motion mid-session. Returns the teardown.
 */
export function startMotionRuntime(router: AnyRouter): () => void {
    const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY)

    void startSmoothScroll()
    bindReveals(appRoot())
    bindScrollEffects(appRoot())
    const stopPointerEffects = initPointerEffects()

    const unsubscribe = router.subscribe('onRendered', (event) => {
        bindReveals(appRoot())
        bindScrollEffects(appRoot())

        // A hash link to another page (`/#work` from Services): jump to the section under the curtain. The router's
        // own hash jump is off (`defaultHashScrollIntoView: false`); same-page links are handled below.
        const { hash } = event.toLocation
        if (!hash || !event.pathChanged) return
        const target = document.getElementById(hash)
        if (target) scrollToElement(target, { immediate: true })
    })

    // Same-page hash links scroll smoothly through Lenis, also when the URL already has that hash.
    const onClick = (event: MouseEvent) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
        const anchor = eventElement(event)?.closest('a[href*="#"]')
        if (!(anchor instanceof HTMLAnchorElement) || anchor.origin !== window.location.origin) return
        if (anchor.pathname !== window.location.pathname || !anchor.hash) return
        const target = document.getElementById(decodeURIComponent(anchor.hash.slice(1)))
        if (!target) return
        requestAnimationFrame(() => scrollToElement(target, { immediate: isPageCovered() }))
    }
    document.addEventListener('click', onClick)

    // Measured scroll effects (heading slides) depend on the layout: re-measure after a resize settles.
    let resizeTimer: ReturnType<typeof setTimeout> | undefined
    let lastWidth = window.innerWidth
    const onResize = () => {
        // Mobile browsers fire resize when the toolbar shows or hides; only a width change alters the layout.
        if (window.innerWidth === lastWidth) return
        lastWidth = window.innerWidth
        clearTimeout(resizeTimer)
        resizeTimer = setTimeout(() => bindScrollEffects(appRoot()), 250)
    }
    window.addEventListener('resize', onResize, { passive: true })

    const onReducedMotionChange = () => {
        if (reducedMotion.matches) {
            destroySmoothScroll()
            unbindScrollEffects()
            revealAllNow()
        } else {
            void startSmoothScroll()
            bindScrollEffects(appRoot())
        }
    }
    reducedMotion.addEventListener('change', onReducedMotionChange)

    return () => {
        unsubscribe()
        document.removeEventListener('click', onClick)
        window.removeEventListener('resize', onResize)
        clearTimeout(resizeTimer)
        stopPointerEffects()
        reducedMotion.removeEventListener('change', onReducedMotionChange)
        unbindScrollEffects()
        destroySmoothScroll()
    }
}
