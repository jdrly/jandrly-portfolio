import { useEffect, useRef, useState } from 'react'
import { announce, setAppInert } from '@/components/motion/a11y'
import { GlyphReels } from '@/components/motion/GlyphReels'
import { Barcode } from '@/components/ui/Barcode'
import { GLYPH_WORDS } from '@/components/ui/glyphWords'
import { revealPage } from '@/lib/motion/pageCover'
import { SITE } from '@/lib/site'
import * as m from '@/paraglide/messages'

/**
 * First-visit intro: glyph reels spin while a loading bar counts to 100 %, the status reads "loading complete" →
 * "initiating…", then an ink + coral double curtain wipes up and reveals the page, whose entrances play behind it.
 *
 * - Shown once per browser session, on the first page load, never under reduced motion or to crawlers (decided by
 *   the inline head script, which sets `html[data-intro="play"]` before the first paint).
 * - The page is fully server-rendered underneath and paints first (so the LCP is not delayed); the overlay is
 *   `aria-hidden`, the page is `inert` while it is up, and a polite live region announces loading and completion.
 * - Never hangs: loading completes by MAX_LOADING_MS; a CSS failsafe hides the overlay if JavaScript never runs.
 */
/** Absolute safety net: the overlay is gone by now whatever happens (the CSS failsafe covers the no-JS case). */
const HARD_STOP_MS = 6500

export function IntroLoader() {
    const rootRef = useRef<HTMLDivElement>(null)
    const [finished, setFinished] = useState(false)

    useEffect(() => {
        const html = document.documentElement
        const root = rootRef.current
        if (html.dataset.intro !== 'play' || !root) return
        // Taking over: the CSS failsafe is keyed to `play`.
        html.dataset.intro = 'run'

        const bar = root.querySelector<HTMLElement>('[data-intro-bar]')
        const percent = root.querySelector<HTMLElement>('[data-intro-pct]')
        const label = root.querySelector<HTMLElement>('[data-intro-label]')
        const panel = root.querySelector<HTMLElement>('[data-intro-panel]')
        const accent = root.querySelector<HTMLElement>('[data-intro-accent]')
        const content = root.querySelector<HTMLElement>('[data-intro-content]')
        if (!bar || !percent || !label || !panel || !accent || !content) return

        let done = false
        const finish = () => {
            if (done) return
            done = true
            clearTimeout(hardStop)
            setAppInert(false)
            revealPage()
            delete html.dataset.intro
            setFinished(true)
        }
        const hardStop = setTimeout(finish, Math.max(0, HARD_STOP_MS - performance.now()))

        setAppInert(true)
        announce(m.intro_status_loading())

        void import('@/components/motion/introController')
            .then(({ runIntro }) => runIntro({ bar, percent, label, panel, accent, content }))
            .then(finish)
            .catch(finish)
        return () => {
            clearTimeout(hardStop)
        }
    }, [])

    if (finished) return null

    return (
        <div ref={rootRef} className="intro" aria-hidden="true">
            <div data-intro-accent className="intro-layer bg-coral" />
            <div data-intro-panel className="intro-layer bg-grain-dark text-paper">
                <div data-intro-content className="container-page flex h-full flex-col justify-between py-6 lg:py-10">
                    <div className="flex items-start justify-between gap-6 font-mono text-label text-on-dark uppercase">
                        <span>
                            {SITE.name} — {SITE.domain}
                        </span>
                        <span className="hidden sm:inline">SYS.BOOT / CZ.26</span>
                    </div>

                    <GlyphReels glyphs={GLYPH_WORDS.name} className="self-center text-[clamp(2.25rem,8vw,8.5rem)] text-paper" />

                    <div className="flex flex-col gap-3 lg:gap-4">
                        <div className="flex items-end justify-between gap-6 font-mono">
                            <span data-intro-label className="min-w-0 flex-1 truncate text-label text-on-dark-label uppercase">
                                {m.intro_loading()}
                            </span>
                            {/* Fixed width (room for "100%"), so the readout never shifts as digits are added. */}
                            <span className="inline-block w-[2.6em] text-right text-[clamp(2.5rem,5vw,4.5rem)] leading-none font-medium tracking-[-0.04em] text-paper tabular-nums">
                                <span data-intro-pct className="intro-pct" />%
                            </span>
                        </div>
                        <div className="h-[3px] overflow-hidden bg-line-dark">
                            <div data-intro-bar className="intro-bar h-full bg-coral" />
                        </div>
                        <div className="flex items-center justify-between gap-6">
                            <Barcode className="h-6 w-[104px] text-line-dark-strong lg:h-7 lg:w-[127px]" />
                            <span className="font-mono text-[0.75rem] tracking-[0.0625rem] text-on-dark-muted uppercase">H.01 · CZ.26</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
