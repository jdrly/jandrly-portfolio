// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { TEXT_SIZE_TOKENS, cn } from './utils'

const styles = readFileSync(new URL('../styles.css', import.meta.url), 'utf8')

/** `--text-<name>:` font-size tokens declared in styles.css (not their `--text-<name>--line-height` etc. companions). */
function declaredTextTokens(css: string) {
    return [...css.matchAll(/--text-([a-z0-9-]+?):/g)].map((match) => match[1]).filter((name) => !name.includes('--'))
}

describe('cn', () => {
    it('merges conditional classes and resolves Tailwind conflicts', () => {
        expect(cn('px-2 text-sm', null, undefined, 'px-4')).toBe('text-sm px-4')
    })

    it('treats design type tokens as font sizes, not colors', () => {
        expect(cn('text-label text-ink', 'text-h1')).toBe('text-ink text-h1')
        expect(cn('text-ink-soft text-body', 'text-paper')).toBe('text-body text-paper')
        expect(cn('text-section-title text-ink', 'text-paper')).toBe('text-section-title text-paper')
    })

    it('knows exactly the type tokens declared in styles.css', () => {
        const declared = declaredTextTokens(styles)

        expect(declared.length).toBeGreaterThan(0)
        expect([...TEXT_SIZE_TOKENS].sort()).toEqual([...new Set(declared)].sort())
    })
})
