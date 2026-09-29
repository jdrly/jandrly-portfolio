import { clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'
import type { ClassValue } from 'clsx'

/**
 * Custom `--text-*` tokens from src/styles.css. tailwind-merge must know them as font sizes, otherwise
 * `text-label` would be treated as a color and silently drop `text-ink` (and vice versa).
 */
export const TEXT_SIZE_TOKENS = [
    'display-2xl',
    'display-xl',
    'h1',
    'h2',
    'h3',
    'h4',
    'home-title',
    'section-title',
    'h5',
    'h6',
    'title',
    'stat',
    'cell',
    'value',
    'lead',
    'page-lead',
    'body',
    'body-sm',
    'label',
    'label-lg',
    'button',
    'code',
    'index',
    'index-lg',
]

const twMerge = extendTailwindMerge({
    extend: {
        theme: {
            text: TEXT_SIZE_TOKENS,
        },
    },
})

export function cn(...inputs: Array<ClassValue>) {
    return twMerge(clsx(inputs))
}
