import { describe, expect, it } from 'vitest'
import { createPageHead } from './pageHead'
import { INDEXED_PAGES, createRobotsTxt, createSeoHead, createSitemapXml, createVerificationMeta, getLocalizedUrl } from './seo'
import { SITE } from './site'
import { createPageStructuredData } from './structuredData'
import type { IndexedPage } from './seo'
import type { Locale } from '../paraglide/runtime'

const LOCALES: ReadonlyArray<Locale> = ['cs', 'en']

type GraphNode = Record<string, unknown> & { '@type': string | Array<string>; '@id'?: string }

function graphOf(path: IndexedPage, locale: Locale) {
    return createPageStructuredData({ path, title: 'Title', description: 'Description' }, locale)['@graph'] as Array<GraphNode>
}

function nodeOfType(graph: Array<GraphNode>, type: string) {
    return graph.find((node) => [node['@type']].flat().includes(type))
}

describe('canonical and hreflang', () => {
    it('builds canonical URLs on the preferred host with Paraglide URL patterns', () => {
        expect(getLocalizedUrl('/', 'cs')).toBe('https://www.jandrly.cz/')
        expect(getLocalizedUrl('/', 'en')).toBe('https://www.jandrly.cz/en/')
        expect(getLocalizedUrl('/about', 'cs')).toBe('https://www.jandrly.cz/about')
        expect(getLocalizedUrl('/about', 'en')).toBe('https://www.jandrly.cz/en/about')
    })

    it('targets Czech and Slovak readers with the Czech page, and everyone else with the English one', () => {
        const head = createSeoHead({ title: 'Služby | Jan Drlý', description: 'Popis.', path: '/services' }, 'cs')

        expect(head.links).toEqual([
            { rel: 'canonical', href: 'https://www.jandrly.cz/services' },
            { rel: 'alternate', hrefLang: 'cs', href: 'https://www.jandrly.cz/services' },
            { rel: 'alternate', hrefLang: 'sk', href: 'https://www.jandrly.cz/services' },
            { rel: 'alternate', hrefLang: 'en', href: 'https://www.jandrly.cz/en/services' },
            { rel: 'alternate', hrefLang: 'x-default', href: 'https://www.jandrly.cz/en/services' },
        ])
        expect(head.meta).toContainEqual({ property: 'og:locale', content: 'cs_CZ' })
        expect(head.meta).toContainEqual({ property: 'og:locale:alternate', content: 'en_US' })
    })

    it('uses the same (reciprocal) alternates on both language versions, each self-canonical', () => {
        for (const path of INDEXED_PAGES) {
            const [cs, en] = LOCALES.map((locale) => createSeoHead({ title: 'T', description: 'D', path }, locale))
            expect(cs.links.slice(1)).toEqual(en.links.slice(1))
            expect(cs.links[0].href).toBe(getLocalizedUrl(path, 'cs'))
            expect(en.links[0].href).toBe(getLocalizedUrl(path, 'en'))
        }
    })
})

describe('search engine verification', () => {
    it('renders only the tokens that are set, under each engine’s meta name', () => {
        expect(createVerificationMeta({})).toEqual([])
        expect(createVerificationMeta({ google: ' g-token ', bing: '', seznam: 's-token' })).toEqual([
            { name: 'google-site-verification', content: 'g-token' },
            { name: 'seznam-wmt', content: 's-token' },
        ])
        expect(createVerificationMeta({ bing: 'b-token' })).toEqual([{ name: 'msvalidate.01', content: 'b-token' }])
    })

    it('leaves the tokens off every page except the homepage', () => {
        const verificationNames = new Set(['google-site-verification', 'msvalidate.01', 'seznam-wmt'])

        for (const path of INDEXED_PAGES.filter((page) => page !== '/')) {
            const names = createPageHead(path, 'T', 'D').meta.map((meta) => ('name' in meta ? meta.name : undefined))
            expect(names.filter((name) => name !== undefined && verificationNames.has(name))).toEqual([])
        }
    })
})

describe('structured data', () => {
    it('describes the person and the business by @id, with the same facts in both locales', () => {
        for (const locale of LOCALES) {
            const graph = graphOf('/', locale)

            expect(nodeOfType(graph, 'Person')).toMatchObject({
                '@id': `${SITE.origin}/#person`,
                name: SITE.name,
                telephone: SITE.phone.e164,
                sameAs: Object.values(SITE.socials),
            })
            expect(nodeOfType(graph, 'Organization')).toMatchObject({
                '@id': `${SITE.origin}/#business`,
                founder: { '@id': `${SITE.origin}/#person` },
                sameAs: Object.values(SITE.listings),
            })
            expect(nodeOfType(graph, 'WebSite')).toMatchObject({ '@id': `${SITE.origin}/#website`, url: `${SITE.origin}/` })
        }
        expect(nodeOfType(graphOf('/', 'cs'), 'Organization')?.areaServed).toEqual(nodeOfType(graphOf('/', 'en'), 'Organization')?.areaServed)
    })

    it('contains no e-mail address, ratings or reviews', () => {
        for (const path of INDEXED_PAGES) {
            for (const locale of LOCALES) {
                const json = JSON.stringify(graphOf(path, locale))
                expect(json).not.toMatch(/@\w+\.|mailto:|"email"/i)
                expect(json).not.toMatch(/aggregateRating|"review"/i)
            }
        }
    })

    it('resolves every @id reference to a node of the same graph', () => {
        for (const path of INDEXED_PAGES) {
            const graph = graphOf(path, 'en')
            const ids = new Set(graph.map((node) => node['@id']))
            const references = [...JSON.stringify(graph).matchAll(/\{"@id":"([^"]+)"\}/g)].map((match) => match[1])

            expect(references.length).toBeGreaterThan(0)
            for (const reference of references) {
                expect(ids).toContain(reference)
            }
        }
    })

    it('types each page and adds breadcrumbs to subpages', () => {
        expect(nodeOfType(graphOf('/about', 'cs'), 'ProfilePage')).toMatchObject({ mainEntity: { '@id': `${SITE.origin}/#person` } })
        expect(nodeOfType(graphOf('/contact', 'cs'), 'ContactPage')).toBeDefined()
        expect(nodeOfType(graphOf('/', 'cs'), 'BreadcrumbList')).toBeUndefined()
        expect(nodeOfType(graphOf('/services', 'en'), 'BreadcrumbList')?.itemListElement).toEqual([
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.jandrly.cz/en/' },
            { '@type': 'ListItem', position: 2, name: 'Services', item: 'https://www.jandrly.cz/en/services' },
        ])
    })

    it('lists the services as an offer catalog on the services page only', () => {
        const offers = nodeOfType(graphOf('/services', 'en'), 'OfferCatalog')?.itemListElement as Array<{ itemOffered: GraphNode }>

        expect(offers).toHaveLength(6)
        expect(offers[0].itemOffered).toMatchObject({ '@type': 'Service', name: 'Custom web applications' })
        expect(nodeOfType(graphOf('/about', 'en'), 'OfferCatalog')).toBeUndefined()
    })
})

describe('sitemap', () => {
    const lastmod = '2026-09-28T12:00:00+02:00'
    const doc = new DOMParser().parseFromString(createSitemapXml(lastmod), 'application/xml')

    it('is well-formed XML', () => {
        expect(doc.getElementsByTagName('parsererror')).toHaveLength(0)
        expect(doc.documentElement.tagName).toBe('urlset')
    })

    it('lists every indexed page in both locales, each with its alternates and lastmod', () => {
        const urls = [...doc.getElementsByTagName('url')]
        const locs = urls.map((url) => url.getElementsByTagName('loc')[0].textContent)

        expect(locs).toEqual(INDEXED_PAGES.flatMap((path) => [getLocalizedUrl(path, 'cs'), getLocalizedUrl(path, 'en')]))

        for (const url of urls) {
            const alternates = [...url.getElementsByTagName('xhtml:link')].map((link) => link.getAttribute('hreflang'))
            expect(alternates).toEqual(['cs', 'sk', 'en', 'x-default'])
            expect(url.getElementsByTagName('lastmod')[0].textContent).toBe(lastmod)
        }
    })

    it('omits lastmod when the date is unknown', () => {
        expect(createSitemapXml(undefined)).not.toContain('<lastmod>')
    })
})

describe('robots.txt', () => {
    it('blocks only the server function endpoint and points to the absolute sitemap URL', () => {
        expect(createRobotsTxt()).toBe(
            ['User-agent: *', 'Allow: /', 'Disallow: /_serverFn/', '', 'Sitemap: https://www.jandrly.cz/sitemap.xml', ''].join('\n'),
        )
    })
})
