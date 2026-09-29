/**
 * Shared motion vocabulary and browser checks. Everything in `src/lib/motion` runs on the client only (effects and
 * event handlers); nothing here may influence server-rendered markup.
 */

export type CubicBezier = [number, number, number, number]

/** Long, decisive deceleration: headline and card entrances. */
export const EASE_OUT_EXPO: CubicBezier = [0.16, 1, 0.3, 1]
/** Symmetric, heavy in-out: curtains and wipes. */
export const EASE_IN_OUT_QUART: CubicBezier = [0.76, 0, 0.24, 1]
/** The design's `--ease-out-soft`. */
export const EASE_OUT_SOFT: CubicBezier = [0.22, 1, 0.36, 1]
/** Small overshoot for ornaments (stars, sparkles, dots). */
export const EASE_OUT_BACK: CubicBezier = [0.34, 1.56, 0.64, 1]

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
const FINE_POINTER_QUERY = '(hover: hover) and (pointer: fine)'

export function prefersReducedMotion(): boolean {
    return typeof window !== 'undefined' && window.matchMedia(REDUCED_MOTION_QUERY).matches
}

export function hasFinePointer(): boolean {
    return typeof window !== 'undefined' && window.matchMedia(FINE_POINTER_QUERY).matches
}

/** Resolves on the next frame after the next paint, i.e. once the current DOM state has been painted at least once. */
export function afterNextPaint(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
}

/** The element an event happened on (events on the document or a text node have none). */
export function eventElement(event: Event): Element | null {
    return event.target instanceof Element ? event.target : null
}

export function wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * The identity version of a transform list, keeping its functions and units: `translateY(112%) rotate(5deg)
 * scale(0.9)` → `translateY(0%) rotate(0deg) scale(1)`. Animate to this instead of `none`: Motion interpolates to
 * `none` by zeroing every number of the start value, which turns `scale(…)` into `scale(0)`.
 */
export function identityTransform(transform: string): string {
    return transform.replace(/([a-zA-Z0-9]+)\(([^)]*)\)/g, (_match, name: string, args: string) => {
        if (name === 'perspective') return `${name}(${args})`
        const values = args.split(',').map((arg) => (name.startsWith('scale') ? '1' : arg.trim().replace(/^-?[\d.]+/, '0')))
        return `${name}(${values.join(', ')})`
    })
}

/** Uppercase mono alphabet for scrambles: every glyph has the same advance in JetBrains Mono, so nothing reflows. */
export const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/.#_'
