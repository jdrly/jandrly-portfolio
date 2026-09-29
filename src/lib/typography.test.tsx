import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { keepHyphenatedWords } from './typography'

describe('keepHyphenatedWords', () => {
    it('returns text without hyphenated words unchanged', () => {
        expect(keepHyphenatedWords('Napište mi')).toBe('Napište mi')
    })

    it('wraps each hyphenated word in a no-wrap span and keeps the text itself', () => {
        const markup = renderToStaticMarkup(<p>{keepHyphenatedWords('Otisk e-mailové adresy a doménu e-mailu.')}</p>)

        expect(markup).toBe(
            '<p>Otisk <span class="whitespace-nowrap">e-mailové</span> adresy a doménu <span class="whitespace-nowrap">e-mailu</span>.</p>',
        )
    })
})
