import { animate } from 'motion'
import { EASE_IN_OUT_QUART, EASE_OUT_BACK, EASE_OUT_EXPO, afterNextPaint, wait } from '@/lib/motion/env'
import { announce, setAppInert } from '@/components/motion/a11y'
import { revealPage } from '@/lib/motion/pageCover'
import { scrambleIn } from '@/lib/motion/textEffects'
import * as m from '@/paraglide/messages'

/*
 * The intro loader's timeline (IntroLoader.tsx renders the markup and loads this module after hydration). Until it
 * takes over, the bar, the percent readout and the glyph reels run on CSS alone.
 */

/** Loading may finish no earlier than this after navigation start (the bar needs time to read as a count)… */
const MIN_LOADING_MS = 950
/** …and is forced to 100 % at this point even if fonts or the hero image are still pending. */
const MAX_LOADING_MS = 2600

/** The page is ready enough to reveal: web fonts, the high-priority (LCP) images decoded, one painted frame. */
function pageReady(): Promise<unknown> {
    const images = Array.from(document.querySelectorAll<HTMLImageElement>('main img[fetchpriority="high"]'))
    return Promise.all([document.fonts.ready, ...images.map((image) => image.decode().catch(() => undefined)), afterNextPaint()])
}

/** Current scaleX of the bar (the pre-hydration CSS animation is running until we take over). */
function readScaleX(element: HTMLElement): number {
    const matrix = getComputedStyle(element).transform
    if (!matrix || matrix === 'none') return 0
    const match = /matrix\(([-\d.e]+)/.exec(matrix)
    return match ? Math.min(1, Math.max(0, Number(match[1]))) : 0
}

function readPercent(element: HTMLElement): number {
    return Number.parseInt(getComputedStyle(element).getPropertyValue('--intro-pct'), 10) || 0
}

interface ProgressParts {
    bar: HTMLElement
    percent: HTMLElement
}

/** Drive the bar (compositor transform) and the percent readout (a counter on one tiny element) together. */
function progressTo(parts: ProgressParts, from: number, to: number, duration: number) {
    parts.bar.style.animation = 'none'
    parts.percent.style.animation = 'none'
    parts.percent.dataset.js = ''
    const bar = animate(parts.bar, { transform: [`scaleX(${from})`, `scaleX(${to})`] }, { duration, ease: EASE_OUT_EXPO })
    const readout = animate(from, to, {
        duration,
        ease: EASE_OUT_EXPO,
        // Plain text from here on (the CSS counter only covers the time before hydration).
        onUpdate: (value) => {
            parts.percent.textContent = String(Math.round(value * 100)).padStart(3, '0')
        },
    })
    return {
        finished: Promise.all([bar, readout]).then(() => undefined),
        stop: () => {
            bar.stop()
            readout.stop()
        },
    }
}

/** Stop every glyph reel inside `container` on its target glyph, left to right. */
function settleGlyphReels(container: ParentNode, { perReel = 0.07 } = {}): Promise<void> {
    const reels = Array.from(container.querySelectorAll<SVGElement>('.glyph-reel[data-reel-target]'))
    return Promise.all(
        reels.map((reel, index) => {
            const target = Number(reel.dataset.reelTarget)
            const from = target >= 3 ? target - 3 : target + 3
            reel.style.animation = 'none'
            reel.style.transform = `translateY(-${from}em)`
            return animate(
                reel,
                { transform: [`translateY(-${from}em)`, `translateY(-${target}em)`] },
                { duration: 0.5, ease: EASE_OUT_BACK, delay: index * perReel },
            )
        }),
    ).then(() => undefined)
}

interface IntroParts {
    bar: HTMLElement
    percent: HTMLElement
    label: HTMLElement
    panel: HTMLElement
    accent: HTMLElement
    content: HTMLElement
}

/** Count to 100 %, swap the status lines, wipe the overlay away and reveal the page. Resolves when it is gone. */
export async function runIntro({ bar, percent, label, panel, accent, content }: IntroParts): Promise<void> {
    const parts = { bar, percent }
    let current = Math.max(readScaleX(bar), readPercent(percent) / 100)

    // Creep towards 90 % while waiting; the remaining time sets the pace.
    const creepMs = Math.max(400, MAX_LOADING_MS - performance.now())
    const creep = progressTo(parts, current, 0.9, creepMs / 1000)
    await Promise.race([pageReady(), wait(creepMs)])
    await wait(Math.max(0, MIN_LOADING_MS - performance.now()))
    creep.stop()
    current = readScaleX(bar)
    await progressTo(parts, current, 1, 0.3).finished

    // "Loading complete" → "Initiating…", each decoded in, while the reels lock onto the name.
    void settleGlyphReels(content)
    const swapLabel = async (text: string, hold: number) => {
        label.textContent = text
        await scrambleIn(label, { base: 0.16, perChar: 0.008 })
        await wait(hold)
    }
    await swapLabel(m.intro_complete(), 200)
    await swapLabel(m.intro_initiating(), 150)

    // Exit: ink panel wipes up (its content rising faster), then the coral layer; the page plays in behind.
    setAppInert(false)
    announce(m.intro_status_done())
    const wipe = { duration: 0.8, ease: EASE_IN_OUT_QUART }
    const exit = Promise.all([
        animate(panel, { clipPath: ['inset(0% 0% 0% 0%)', 'inset(0% 0% 100% 0%)'] }, wipe),
        animate(content, { transform: ['translateY(0vh)', 'translateY(-18vh)'] }, wipe),
        animate(accent, { clipPath: ['inset(0% 0% 0% 0%)', 'inset(0% 0% 100% 0%)'] }, { ...wipe, delay: 0.12 }),
    ])
    await wait(340)
    revealPage()
    await exit
}
