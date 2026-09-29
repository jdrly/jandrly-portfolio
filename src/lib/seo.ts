import { getLocale, localizeUrl } from '../paraglide/runtime'
import { SITE } from './site'
import type { FileRoutesByTo } from '../routeTree.gen'
import type { Locale } from '../paraglide/runtime'

const OG_IMAGE_URL = `${SITE.origin}/og-image.png`

/** Every indexable page (both locales each). Drives the canonical/alternate links, structured data and the sitemap. */
export const INDEXED_PAGES = ['/', '/about', '/services', '/contact', '/privacy'] as const satisfies ReadonlyArray<keyof FileRoutesByTo>

export type IndexedPage = (typeof INDEXED_PAGES)[number]

/**
 * hreflang targeting. One URL may carry several hreflang values:
 * - `cs` and `sk` both point to the Czech pages. The Czech version serves Czechia and Slovakia, there is no
 *   Slovak translation and Slovak readers understand Czech. Without the `sk` entry, a Slovak-language searcher
 *   matches no hreflang value and would be sent to `x-default` (English).
 * - `en` serves the rest of Europe.
 * - `x-default` (users whose language matches none of the above, e.g. German or Polish) is English, the
 *   Europe-wide working language, not Czech.
 */
export const HREFLANG_TARGETS = [
    { hreflang: 'cs', locale: 'cs' },
    { hreflang: 'sk', locale: 'cs' },
    { hreflang: 'en', locale: 'en' },
] as const satisfies ReadonlyArray<{ hreflang: string; locale: Locale }>

export const X_DEFAULT_LOCALE: Locale = 'en'

const OG_LOCALES: Record<Locale, string> = { cs: 'cs_CZ', en: 'en_US' }

/** Paths crawlers should skip. `/_serverFn/` only answers form requests and has no content. */
const ROBOTS_DISALLOW = ['/_serverFn/'] as const

interface SeoOptions {
    title: string
    description: string
    path: IndexedPage
    structuredData?: object
}

/** Absolute URL of a page in a locale, on the canonical origin. The URL scheme is Paraglide's (see `vite.config.ts`). */
export function getLocalizedUrl(path: IndexedPage, locale: Locale): string {
    return localizeUrl(new URL(path, SITE.origin), { locale }).href
}

/** hreflang alternates of a page. Identical on every language version, because they must be reciprocal. */
export function getAlternateLinks(path: IndexedPage): Array<{ hrefLang: string; href: string }> {
    return [
        ...HREFLANG_TARGETS.map(({ hreflang, locale }) => ({ hrefLang: hreflang, href: getLocalizedUrl(path, locale) })),
        { hrefLang: 'x-default', href: getLocalizedUrl(path, X_DEFAULT_LOCALE) },
    ]
}

export function createSeoHead(options: SeoOptions, locale: Locale = getLocale()) {
    const canonicalUrl = getLocalizedUrl(options.path, locale)
    const alternateLocale = locale === 'cs' ? 'en' : 'cs'
    const imageAlt = locale === 'cs' ? `${SITE.name}, full-stack vývojář` : `${SITE.name}, full-stack developer`

    return {
        meta: [
            { title: options.title },
            { name: 'description', content: options.description },
            { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1' },
            { property: 'og:type', content: 'website' },
            { property: 'og:url', content: canonicalUrl },
            { property: 'og:title', content: options.title },
            { property: 'og:description', content: options.description },
            { property: 'og:image', content: OG_IMAGE_URL },
            { property: 'og:image:type', content: 'image/png' },
            { property: 'og:image:width', content: '1200' },
            { property: 'og:image:height', content: '630' },
            { property: 'og:image:alt', content: imageAlt },
            { property: 'og:site_name', content: SITE.name },
            { property: 'og:locale', content: OG_LOCALES[locale] },
            { property: 'og:locale:alternate', content: OG_LOCALES[alternateLocale] },
            { name: 'twitter:card', content: 'summary_large_image' },
            { name: 'twitter:title', content: options.title },
            { name: 'twitter:description', content: options.description },
            { name: 'twitter:image', content: OG_IMAGE_URL },
            { name: 'twitter:image:alt', content: imageAlt },
        ],
        links: [{ rel: 'canonical', href: canonicalUrl }, ...getAlternateLinks(options.path).map((link) => ({ rel: 'alternate', ...link }))],
        scripts: options.structuredData
            ? [
                  {
                      type: 'application/ld+json',
                      children: JSON.stringify(options.structuredData).replaceAll('<', '\\u003c'),
                  },
              ]
            : undefined,
    }
}

export interface SiteVerificationTokens {
    google?: string
    bing?: string
    seznam?: string
}

/**
 * Search engine ownership tokens (public by design, they end up in the HTML). Read at build time from the
 * `VITE_GOOGLE_SITE_VERIFICATION`, `VITE_BING_SITE_VERIFICATION` and `VITE_SEZNAM_SITE_VERIFICATION` environment
 * variables (see `.env.example`); rendered on the homepage of both locales, and only the ones that are set.
 */
export const SITE_VERIFICATION: SiteVerificationTokens = {
    google: import.meta.env.VITE_GOOGLE_SITE_VERIFICATION,
    bing: import.meta.env.VITE_BING_SITE_VERIFICATION,
    seznam: import.meta.env.VITE_SEZNAM_SITE_VERIFICATION,
}

const VERIFICATION_META_NAMES: Record<keyof SiteVerificationTokens, string> = {
    google: 'google-site-verification',
    bing: 'msvalidate.01',
    seznam: 'seznam-wmt',
}

export function createVerificationMeta(tokens: SiteVerificationTokens = SITE_VERIFICATION) {
    return (Object.keys(VERIFICATION_META_NAMES) as Array<keyof SiteVerificationTokens>).flatMap((engine) => {
        const token = tokens[engine]?.trim()
        return token ? [{ name: VERIFICATION_META_NAMES[engine], content: token }] : []
    })
}

function escapeXml(value: string) {
    return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
}

/**
 * Date of the last content change (ISO 8601), taken from git at build time (see `vite.config.ts`).
 * The sitemap omits `lastmod` when it is unknown: a wrong date is worse than none.
 */
export const CONTENT_LASTMOD: string | undefined = import.meta.env.VITE_CONTENT_LASTMOD || undefined

/** `sitemap.xml`: every indexed page in every locale, each with its hreflang alternates. */
export function createSitemapXml(lastmod: string | undefined = CONTENT_LASTMOD) {
    const locales = [...new Set(HREFLANG_TARGETS.map((target) => target.locale))]
    const lastmodLine = lastmod ? `\n    <lastmod>${escapeXml(lastmod)}</lastmod>` : ''
    const urls = INDEXED_PAGES.flatMap((path) => {
        const alternates = getAlternateLinks(path)
            .map(({ hrefLang, href }) => `    <xhtml:link rel="alternate" hreflang="${hrefLang}" href="${escapeXml(href)}" />`)
            .join('\n')

        return locales.map(
            (locale) => `  <url>\n    <loc>${escapeXml(getLocalizedUrl(path, locale))}</loc>${lastmodLine}\n${alternates}\n  </url>`,
        )
    })

    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
        ...urls,
        '</urlset>',
        '',
    ].join('\n')
}

/** `robots.txt`: everything is crawlable except the form endpoint; points to the sitemap on the canonical origin. */
export function createRobotsTxt() {
    const disallow = ROBOTS_DISALLOW.map((path) => `Disallow: ${path}`)
    return ['User-agent: *', 'Allow: /', ...disallow, '', `Sitemap: ${SITE.origin}/sitemap.xml`, ''].join('\n')
}
