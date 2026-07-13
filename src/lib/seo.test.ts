import { describe, expect, it } from 'vitest'
import { createSeoHead, getLocalizedPath, getLocalizedUrl } from './seo'

describe('SEO helpers', () => {
    it('builds localized paths for Czech and English pages', () => {
        expect(getLocalizedPath('/', 'cs')).toBe('/')
        expect(getLocalizedPath('/', 'en')).toBe('/en/')
        expect(getLocalizedPath('/services', 'cs')).toBe('/services')
        expect(getLocalizedPath('/services', 'en')).toBe('/en/services')
    })

    it('builds canonical URLs on the preferred host', () => {
        expect(getLocalizedUrl('/about', 'cs')).toBe('https://www.jandrly.cz/about')
        expect(getLocalizedUrl('/about', 'en')).toBe('https://www.jandrly.cz/en/about')
    })

    it('links every localized page to both language variants', () => {
        const head = createSeoHead(
            {
                title: 'Služby | Jan Drlý',
                description: 'Vývoj webů a aplikací.',
                path: '/services',
            },
            'cs',
        )

        expect(head.links).toEqual([
            { rel: 'canonical', href: 'https://www.jandrly.cz/services' },
            { rel: 'alternate', hrefLang: 'cs', href: 'https://www.jandrly.cz/services' },
            { rel: 'alternate', hrefLang: 'en', href: 'https://www.jandrly.cz/en/services' },
            { rel: 'alternate', hrefLang: 'x-default', href: 'https://www.jandrly.cz/services' },
        ])
    })
})
