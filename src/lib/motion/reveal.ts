import { animate, cubicBezier, stagger } from 'motion'
import type { DOMKeyframesDefinition } from 'motion'
import { EASE_OUT_BACK, EASE_OUT_EXPO, afterNextPaint, identityTransform, prefersReducedMotion } from '@/lib/motion/env'
import { isPageCovered, onPageReveal } from '@/lib/motion/pageCover'
import { countUp, decodeGlyphs, elementFontReady, scrambleIn, splitIntoSpans, typeIn } from '@/lib/motion/textEffects'
import { riseDistance } from '@/lib/motion/textMask'

/**
 * Entrance animations, declared in markup with `data-reveal="<kind>"` (optional `data-reveal-delay` in seconds).
 *
 * The server always renders content in its final, visible state. An element is only put into its hidden start
 * state when nobody can see that happen:
 *  - while the page is covered (intro loader or route curtain): everything is hidden, and when the cover lifts the
 *    elements in view play in document order, the rest when they scroll in;
 *  - otherwise, only elements that start below the fold are hidden (first IntersectionObserver report), and play
 *    when they scroll in. Content already on screen is never touched.
 * With JavaScript off, with `prefers-reduced-motion`, or before hydration nothing is hidden.
 *
 * Every animation writes `transform`, `opacity` or `clip-path` only (compositor-friendly, no layout shift).
 */

export type RevealKind =
    | 'words'
    | 'chars'
    | 'fade-up'
    | 'fade-down'
    | 'fade'
    | 'clip-down'
    | 'clip-up'
    | 'slide-right'
    | 'window'
    | 'rule'
    | 'rule-y'
    | 'frame'
    | 'wipe-right'
    | 'pop'
    | 'spin'
    | 'pulse'
    | 'stagger'
    | 'cards'
    | 'flip'
    | 'row'
    | 'bars'
    | 'glyphs'
    | 'scramble'
    | 'type'
    | 'count'

interface Effect {
    /** Put the element into its start state. Only ever called while the element is invisible to the user. */
    hide: () => void
    /** Animate to the final state; resolves when done (inline styles cleaned up). */
    play: (delay: number) => Promise<void>
}

type State = 'pending' | 'hidden' | 'playing' | 'done'

interface Binding {
    element: HTMLElement
    effect: Effect
    state: State
    observers: Array<IntersectionObserver>
}

const bindings = new Map<HTMLElement, Binding>()

/** Entrance timing when a cover lifts: first element after BASE, then STEP apart, never later than MAX. */
const COVER_BASE_DELAY = 0.15
const COVER_STEP = 0.07
const COVER_MAX_DELAY = 1.1
/** Elements entering from below play once they are this far into the viewport. */
const ENTER_ROOT_MARGIN = '0px 0px -12% 0px'

// ---------------------------------------------------------------------------------------------------------------
// Effects

type Targets = HTMLElement | SVGElement | Array<HTMLElement | SVGElement>

function toArray(targets: Targets): Array<HTMLElement | SVGElement> {
    return Array.isArray(targets) ? targets : [targets]
}

function setStart(targets: Targets, start: Partial<Record<'opacity' | 'transform' | 'clipPath' | 'transformOrigin', string>>) {
    for (const target of toArray(targets)) Object.assign(target.style, start)
}

function clearStyles(targets: Targets) {
    for (const target of toArray(targets)) {
        target.style.removeProperty('opacity')
        target.style.removeProperty('transform')
        target.style.removeProperty('clip-path')
        target.style.removeProperty('transform-origin')
        target.style.removeProperty('transform-box')
        target.style.removeProperty('visibility')
    }
}

interface TweenOptions {
    duration?: number
    ease?: Array<number>
    perItem?: number
}

/** Text or an image inside: must not be handed over from a compositor layer (see restExactTween). */
function paintsTextOrImage(target: Element): boolean {
    if (target instanceof HTMLImageElement || target.querySelector('img')) return true
    const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT)
    for (let node = walker.nextNode(); node; node = walker.nextNode()) if (node.textContent?.trim()) return true
    return false
}

interface Pose {
    x: [number, 'px' | '%']
    y: [number, 'px' | '%']
    rotate: number
    rotateX: number
    perspective: number
    scale: number
}

/** The start pose of one of the reveal transform strings (translate / rotate / rotateX / perspective / scale). */
function parsePose(transform: string): Pose {
    const pose: Pose = { x: [0, 'px'], y: [0, 'px'], rotate: 0, rotateX: 0, perspective: 0, scale: 1 }
    for (const [, name, args] of transform.matchAll(/([a-zA-Z]+)\(([^)]*)\)/g)) {
        const [first = '0', second = '0'] = args.split(',').map((arg) => arg.trim())
        const length = (value: string): [number, 'px' | '%'] => [Number.parseFloat(value) || 0, value.endsWith('%') ? '%' : 'px']
        if (name === 'translateX') pose.x = length(first)
        else if (name === 'translateY') pose.y = length(first)
        else if (name === 'translate') [pose.x, pose.y] = [length(first), length(second)]
        else if (name === 'rotate') pose.rotate = Number.parseFloat(first)
        else if (name === 'rotateX') pose.rotateX = Number.parseFloat(first)
        else if (name === 'perspective') pose.perspective = Number.parseFloat(first)
        else if (name === 'scale') pose.scale = Number.parseFloat(first)
    }
    return pose
}

function parseInset(clipPath: unknown): Array<number> | null {
    const match = typeof clipPath === 'string' ? /inset\(([^)]*)\)/.exec(clipPath) : null
    return match ? match[1].split(/\s+/).map((value) => Number.parseFloat(value) || 0) : null
}

const easeOutExpo = cubicBezier(...EASE_OUT_EXPO)

/**
 * The entrance of anything that paints text or an image, driven by Motion's JS frame loop and exact at rest.
 *
 * A WAAPI transform / opacity / clip animation keeps its element on a compositor layer, rasterised under the
 * transform; when it ends, Chrome drops the layer and paints the element directly, at its exact subpixel position.
 * The text visibly re-renders ("it shifts like the font re-renders"), an image re-samples. Here there is no layer:
 * translations are rounded to whole device pixels (a rounded translation rasterises exactly like no transform),
 * tilt / scale / 3D rotation reach identity at 75 % of the time and opacity at 60 %, so the last frames are pure
 * pixel moves and the final frame is the element's natural rendering, inline styles gone.
 */
function restExactTween(
    list: Array<HTMLElement | SVGElement>,
    from: { transform?: string; opacity?: number; clipPath?: string },
    delay: number,
    { duration, perItem }: { duration: number; perItem: number },
): Promise<void> {
    const pose = parsePose(from.transform ?? '')
    const inset = parseInset(from.clipPath)
    const dpr = window.devicePixelRatio || 1
    const round = (value: number) => Math.round(value * dpr) / dpr
    return Promise.all(
        list.map((target, index) => {
            const box = target.getBoundingClientRect()
            // Layout size, not the (possibly transformed) visual box.
            const width = target instanceof HTMLElement ? target.offsetWidth : box.width
            const height = target instanceof HTMLElement ? target.offsetHeight : box.height
            const toPx = ([value, unit]: [number, 'px' | '%'], size: number) => (unit === '%' ? (value / 100) * size : value)
            const render = (time: number) => {
                const travel = 1 - easeOutExpo(time)
                const turn = 1 - easeOutExpo(Math.min(1, time / 0.75))
                const parts: Array<string> = []
                const x = round(toPx(pose.x, width) * travel)
                const y = round(toPx(pose.y, height) * travel)
                if (x !== 0 || y !== 0) parts.push(`translate(${x}px, ${y}px)`)
                const rotateX = pose.rotateX * turn
                if (Math.abs(rotateX) > 0.01) parts.push(`perspective(${pose.perspective || 900}px) rotateX(${rotateX}deg)`)
                const rotate = pose.rotate * turn
                if (Math.abs(rotate) > 0.01) parts.push(`rotate(${rotate}deg)`)
                const scale = 1 + (pose.scale - 1) * turn
                if (Math.abs(scale - 1) > 0.0005) parts.push(`scale(${scale})`)
                target.style.transform = parts.join(' ')
                if (from.opacity !== undefined) {
                    const opacity = from.opacity + (1 - from.opacity) * Math.min(1, time / 0.6)
                    target.style.opacity = opacity >= 1 ? '' : String(opacity)
                }
                if (inset) {
                    const px = inset.map((value, side) => round(((side % 2 === 0 ? height : width) * value * travel) / 100))
                    target.style.clipPath = px.every((value) => value === 0) ? '' : `inset(${px.map((value) => `${value}px`).join(' ')})`
                }
            }
            render(0)
            return animate(0, 1, { duration, ease: 'linear', delay: delay + index * perItem, onUpdate: render }).then(() => {
                render(1)
                clearStyles(target)
            })
        }),
    ).then(() => undefined)
}

/**
 * Animate `from` → final state for one or many targets, then drop the inline styles again. Targets that paint text or
 * an image take the rest-exact JS path; purely decorative ones (rules, bars, ornaments) stay on WAAPI.
 */
function tween(
    targets: Targets,
    keyframes: DOMKeyframesDefinition,
    delay: number,
    { duration = 1, ease = EASE_OUT_EXPO, perItem = 0 }: TweenOptions = {},
) {
    const list = toArray(targets)
    if (list.length === 0) return Promise.resolve()
    const exact = list.filter(paintsTextOrImage)
    const exactSet = new Set(exact)
    const decorative = list.filter((target) => !exactSet.has(target))
    const first = (value: unknown) => (Array.isArray(value) ? (value[0] as unknown) : undefined)
    const jobs: Array<Promise<void>> = []
    if (exact.length) {
        const opacity = first(keyframes.opacity)
        jobs.push(
            restExactTween(
                exact,
                {
                    transform: first(keyframes.transform) as string | undefined,
                    opacity: opacity === undefined ? undefined : Number(opacity),
                    clipPath: first(keyframes.clipPath) as string | undefined,
                },
                delay,
                { duration, perItem },
            ),
        )
    }
    if (decorative.length) {
        jobs.push(
            animate(decorative, keyframes, {
                duration,
                ease: ease as [number, number, number, number],
                delay: perItem > 0 ? stagger(perItem, { startDelay: delay }) : delay,
                // Motion commits the final keyframe inline when it finishes; drop it a frame later (it equals the natural state).
            }).then(
                () =>
                    new Promise<void>((resolve) =>
                        requestAnimationFrame(() => {
                            clearStyles(decorative)
                            resolve()
                        }),
                    ),
            ),
        )
    }
    return Promise.all(jobs).then(() => undefined)
}

function childrenOf(element: HTMLElement): Array<HTMLElement> {
    return Array.from(element.children).filter((child): child is HTMLElement => child instanceof HTMLElement)
}

/** Simple from-state → natural-state entrances. */
function transformEffect(
    element: HTMLElement,
    from: { opacity?: string; transform?: string; clipPath?: string; transformOrigin?: string },
    options: TweenOptions = {},
): Effect {
    return {
        hide: () => setStart(element, from),
        play: (delay) => {
            const keyframes: DOMKeyframesDefinition = {}
            if (from.opacity !== undefined) keyframes.opacity = [Number(from.opacity), 1]
            if (from.transform !== undefined) keyframes.transform = [from.transform, identityTransform(from.transform)]
            if (from.clipPath !== undefined) keyframes.clipPath = [from.clipPath, 'inset(0% 0% 0% 0%)']
            return tween(element, keyframes, delay, options)
        },
    }
}

function childrenEffect(element: HTMLElement, from: { transform: string; transformOrigin?: string }, options: TweenOptions): Effect {
    const items = () => childrenOf(element)
    return {
        hide: () => setStart(items(), { opacity: '0', transform: from.transform, transformOrigin: from.transformOrigin ?? '' }),
        play: (delay) =>
            tween(items(), { opacity: [0, 1], transform: [from.transform, identityTransform(from.transform)] }, delay, options),
    }
}

/**
 * Settled split overlays (see splitEffect). They stay until the text reflows anyway or the user interacts with it.
 */
const restingSplits = new Map<HTMLElement, () => void>()

/** Hand the text back to the original element (it is aligned to the overlay to the hundredth of a pixel). */
export function releaseSplits(): void {
    for (const restore of restingSplits.values()) restore()
    restingSplits.clear()
}

let releaseListeners = false
function listenForRelease() {
    if (releaseListeners) return
    releaseListeners = true
    let width = window.innerWidth
    // A width change re-wraps the text (the overlay was built for the old lines).
    window.addEventListener('resize', () => {
        if (window.innerWidth === width) return
        width = window.innerWidth
        releaseSplits()
    })
    // Selecting a split heading hands it back to the original text (which is what gets selected and copied).
    document.addEventListener('selectionchange', () => {
        const selection = document.getSelection()
        if (!selection || selection.isCollapsed) return
        for (const [element, restore] of restingSplits) {
            if (!selection.containsNode(element, true)) continue
            restore()
            restingSplits.delete(element)
        }
    })
}

/**
 * Headline split into words (or characters) that rise out of per-line (or per-word) masks.
 *
 * Pixel-exact by construction, so nothing nudges when the motion ends:
 *  - The rise runs on Motion's JS frame loop, not WAAPI: a WAAPI transform animation puts each piece on its own
 *    compositor layer, and Chrome snaps those layers to whole device pixels, so the glyphs would jump by up to half
 *    a pixel when the layers are dropped.
 *  - Every frame's offset is rounded to whole device pixels (and the words' tilt is done before the last fifth), so
 *    each glyph is rasterised exactly as it is at rest and the last step lands on a transform-free rest.
 *  - At rest the overlay stays: split pieces are separate text runs, which Skia quantises differently from the
 *    original's single run, so swapping back would change the anti-aliasing of every edge ("the name shifts"). The
 *    overlay is aligned to the (transparent, still accessible) original to within 0.01px, and hands back to it only
 *    when the text reflows anyway (width change), when the user selects it, or with reduced motion.
 */
function splitEffect(element: HTMLElement, by: 'words' | 'chars'): Effect {
    return {
        // The split waits for play time: line breaks must be measured with the final web font.
        hide: () => setStart(element, { opacity: '0' }),
        play: async (delay) => {
            await elementFontReady(element)
            const split = splitIntoSpans(element, by === 'words' ? { mask: 'line' } : { chars: true, mask: 'word' })
            const items = by === 'words' ? split.words : split.chars
            const tilt = by === 'words' ? 5 : 0
            // Start fully below the (ink-padded) mask, tilt included; layout sizes (an animating ancestor may be transformed).
            const distances = items.map((item) => riseDistance(item.offsetHeight, split.padding, item.offsetWidth, tilt))
            const dpr = window.devicePixelRatio || 1
            const render = (item: HTMLSpanElement, distance: number, progress: number) => {
                const y = Math.round((1 - progress) * distance * dpr) / dpr
                const angle = tilt * Math.max(0, 1 - progress / 0.8)
                const rotate = Math.abs(angle) < 0.01 ? 0 : angle
                item.style.transform = rotate !== 0 ? `translateY(${y}px) rotate(${rotate}deg)` : y !== 0 ? `translateY(${y}px)` : ''
            }
            items.forEach((item, index) => {
                item.style.transformOrigin = '0% 100%'
                render(item, distances[index], 0)
            })
            element.style.removeProperty('opacity')
            const step = by === 'words' ? 0.06 : 0.035
            await Promise.all(
                items.map((item, index) =>
                    animate(0, 1, {
                        duration: by === 'words' ? 1.15 : 1,
                        ease: EASE_OUT_EXPO,
                        delay: delay + index * step,
                        onUpdate: (progress) => render(item, distances[index], progress),
                    }).then(() => render(item, distances[index], 1)),
                ),
            )
            if (!element.isConnected) return
            listenForRelease()
            restingSplits.set(element, split.restore)
        },
    }
}

function textEffect(element: HTMLElement, run: (delay: number) => Promise<void>): Effect {
    return {
        hide: () => {
            element.style.visibility = 'hidden'
        },
        play: (delay) => {
            element.style.removeProperty('visibility')
            return run(delay)
        },
    }
}

function rowEffect(element: HTMLElement): Effect {
    const rule = () => element.querySelector<HTMLElement>('[data-reveal-rule]')
    const parts = () => Array.from(element.querySelectorAll<HTMLElement>('[data-reveal-part]'))
    return {
        hide: () => {
            const line = rule()
            if (line) setStart(line, { transform: 'scaleX(0)', transformOrigin: '0% 50%' })
            setStart(parts(), { opacity: '0', transform: 'translateY(36px)' })
        },
        play: async (delay) => {
            const line = rule()
            await Promise.all([
                line ? tween(line, { transform: ['scaleX(0)', 'scaleX(1)'] }, delay, { duration: 1.2 }) : Promise.resolve(),
                tween(parts(), { opacity: [0, 1], transform: ['translateY(36px)', 'translateY(0px)'] }, delay + 0.12, {
                    duration: 1,
                    perItem: 0.07,
                }),
            ])
        },
    }
}

function barsEffect(element: HTMLElement): Effect {
    const bars = () => Array.from(element.querySelectorAll<SVGRectElement>('rect'))
    return {
        hide: () => {
            for (const bar of bars()) {
                bar.style.transformBox = 'fill-box'
                bar.style.transformOrigin = '50% 100%'
                bar.style.transform = 'scaleY(0)'
            }
        },
        play: (delay) => tween(bars(), { transform: ['scaleY(0)', 'scaleY(1)'] }, delay, { duration: 0.7, perItem: 0.03 }),
    }
}

function pulseEffect(element: HTMLElement): Effect {
    return {
        hide: () => undefined,
        play: (delay) =>
            new Promise((resolve) => {
                setTimeout(() => {
                    element.classList.add('reveal-pulse')
                    resolve()
                }, delay * 1000)
            }),
    }
}

function createEffect(element: HTMLElement, kind: RevealKind): Effect | null {
    switch (kind) {
        case 'words':
        case 'chars':
            return splitEffect(element, kind)
        case 'fade-up':
            return transformEffect(element, { opacity: '0', transform: 'translateY(48px)' })
        case 'fade-down':
            return transformEffect(element, { opacity: '0', transform: 'translateY(-28px)' }, { duration: 0.9 })
        case 'fade':
            return transformEffect(element, { opacity: '0' }, { duration: 0.8, ease: [0.4, 0, 0.2, 1] })
        case 'clip-down':
            // Images wipe in (a scaled image can never re-sample exactly like the unscaled one at rest).
            return transformEffect(element, { clipPath: 'inset(0% 0% 100% 0%)' }, { duration: 1.4 })
        case 'clip-up':
            return transformEffect(element, { clipPath: 'inset(100% 0% 0% 0%)' }, { duration: 1.3 })
        case 'slide-right':
            return transformEffect(element, { opacity: '0', transform: 'translateX(-38%)' }, { duration: 1.3 })
        case 'window':
            return transformEffect(
                element,
                { opacity: '0', transform: 'translateY(96px) rotate(-2.5deg) scale(0.95)', transformOrigin: '0% 100%' },
                { duration: 1.3 },
            )
        case 'rule':
            return transformEffect(element, { transform: 'scaleX(0)', transformOrigin: '0% 50%' }, { duration: 1.2 })
        case 'rule-y':
            return transformEffect(element, { transform: 'scaleY(0)', transformOrigin: '50% 0%' }, { duration: 1.2 })
        case 'wipe-right':
            return transformEffect(element, { clipPath: 'inset(0% 100% 0% 0%)' }, { duration: 1.3 })
        case 'frame':
            return transformEffect(element, { clipPath: 'inset(0% 100% 100% 0%)' }, { duration: 1.5 })
        case 'pop':
            return transformEffect(
                element,
                { opacity: '0', transform: 'scale(0.2) rotate(-60deg)' },
                { duration: 0.9, ease: EASE_OUT_BACK },
            )
        case 'spin':
            return transformEffect(element, { opacity: '0', transform: 'rotate(-180deg) scale(0.4)' }, { duration: 1.7 })
        case 'pulse':
            return pulseEffect(element)
        case 'stagger':
            return childrenEffect(element, { transform: 'translateY(40px)' }, { duration: 1, perItem: 0.07 })
        case 'cards':
            return childrenEffect(
                element,
                { transform: 'translateY(160px) rotate(4deg)', transformOrigin: '0% 100%' },
                { duration: 1.3, perItem: 0.12 },
            )
        case 'flip':
            return childrenEffect(
                element,
                { transform: 'perspective(900px) rotateX(-92deg)', transformOrigin: '50% 0%' },
                { duration: 1, perItem: 0.045 },
            )
        case 'row':
            return rowEffect(element)
        case 'bars':
            return barsEffect(element)
        case 'glyphs':
            return textEffect(element, (delay) => decodeGlyphs(element, { delay }))
        case 'scramble':
            return textEffect(element, (delay) => scrambleIn(element, { delay }))
        case 'type':
            return textEffect(element, (delay) => typeIn(element, { delay }))
        case 'count':
            return textEffect(element, (delay) => countUp(element, { delay }))
        default:
            return null
    }
}

// ---------------------------------------------------------------------------------------------------------------
// Scheduling

function extraDelay(element: HTMLElement): number {
    return Number.parseFloat(element.dataset.revealDelay ?? '') || 0
}

function isInViewport(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect()
    return rect.bottom > 0 && rect.top < window.innerHeight && rect.width + rect.height > 0
}

function play(binding: Binding, delay: number) {
    if (binding.state === 'playing' || binding.state === 'done') return
    const wasHidden = binding.state === 'hidden'
    binding.state = 'playing'
    disconnect(binding)
    if (!wasHidden) {
        binding.state = 'done'
        return
    }
    binding.effect
        .play(delay + extraDelay(binding.element))
        .catch(() => clearStyles(binding.element))
        .finally(() => {
            binding.state = 'done'
        })
}

function hide(binding: Binding) {
    if (binding.state !== 'pending') return
    binding.effect.hide()
    binding.state = 'hidden'
}

function disconnect(binding: Binding) {
    for (const observer of binding.observers) observer.disconnect()
    binding.observers = []
}

/** Play when the (already hidden) element scrolls into view. */
function playOnEnter(binding: Binding) {
    const observer = new IntersectionObserver(
        (entries) => {
            if (entries.some((entry) => entry.isIntersecting)) play(binding, 0)
        },
        { rootMargin: ENTER_ROOT_MARGIN },
    )
    observer.observe(binding.element)
    binding.observers.push(observer)
}

/** Static page: hide only if the first report says the element is off screen; content on screen stays as it is. */
function classifyOnScreen(binding: Binding) {
    const observer = new IntersectionObserver((entries) => {
        observer.disconnect()
        binding.observers = binding.observers.filter((item) => item !== observer)
        if (entries.some((entry) => entry.isIntersecting)) {
            binding.state = 'done'
            return
        }
        hide(binding)
        playOnEnter(binding)
    })
    observer.observe(binding.element)
    binding.observers.push(observer)
}

let hideQueue: Array<Binding> = []
let hideScheduled = false
let firstPass = true

function scheduleHide(binding: Binding) {
    hideQueue.push(binding)
    if (hideScheduled) return
    hideScheduled = true
    const flush = () => {
        hideScheduled = false
        const queue = hideQueue
        hideQueue = []
        if (!isPageCovered()) return
        for (const item of queue) hide(item)
    }
    // First load: let the server-rendered page paint once first (it is under the intro), so the LCP image and text
    // are painted before anything is hidden. Later passes happen under an opaque route curtain.
    if (firstPass) void afterNextPaint().then(flush)
    else flush()
}

function revealCovered() {
    const waiting = [...bindings.values()]
        .filter((binding) => binding.state === 'pending' || binding.state === 'hidden')
        .sort((a, b) => (a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))

    // Measure everything before starting any animation (no read/write interleaving).
    const inView = new Map(waiting.map((binding) => [binding, binding.state === 'hidden' && isInViewport(binding.element)]))

    let index = 0
    for (const binding of waiting) {
        // Never got hidden (the cover lifted first): leave it as it is.
        if (binding.state === 'pending') {
            binding.state = 'done'
            continue
        }
        if (inView.get(binding)) {
            play(binding, Math.min(COVER_BASE_DELAY + index * COVER_STEP, COVER_MAX_DELAY))
            index++
        } else {
            playOnEnter(binding)
        }
    }
}

let revealSubscribed = false

function bind(element: HTMLElement) {
    const kind = element.dataset.reveal as RevealKind | undefined
    const effect = kind ? createEffect(element, kind) : null
    if (!effect) return
    const binding: Binding = { element, effect, state: 'pending', observers: [] }
    bindings.set(element, binding)
    if (isPageCovered()) scheduleHide(binding)
    else classifyOnScreen(binding)
}

function prune() {
    // Settled splits of a page that is gone: nothing to hand back.
    for (const element of restingSplits.keys()) if (!element.isConnected) restingSplits.delete(element)
    for (const [element, binding] of bindings) {
        if (element.isConnected) continue
        disconnect(binding)
        bindings.delete(element)
    }
}

/** Bind every `[data-reveal]` element that is not bound yet (call after the initial render and each route render). */
export function bindReveals(root: ParentNode = document): void {
    if (prefersReducedMotion()) return
    if (!revealSubscribed) {
        revealSubscribed = true
        onPageReveal(revealCovered)
    }
    prune()
    for (const element of root.querySelectorAll<HTMLElement>('[data-reveal]')) {
        if (!bindings.has(element)) bind(element)
    }
    firstPass = false
}

/** Show everything immediately (reduced motion switched on mid-session, or a safety net). */
export function revealAllNow(): void {
    releaseSplits()
    for (const binding of bindings.values()) {
        disconnect(binding)
        if (binding.state === 'hidden') clearStyles(binding.element)
        for (const child of childrenOf(binding.element)) clearStyles(child)
        binding.element
            .querySelectorAll<HTMLElement | SVGElement>('[data-reveal-part], [data-reveal-rule], rect')
            .forEach((node) => clearStyles(node))
        binding.state = 'done'
    }
}
