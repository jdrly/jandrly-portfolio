import { getLocale } from '../paraglide/runtime'
import type { Locale } from '../paraglide/runtime'

export const SITE_ORIGIN = 'https://www.jandrly.cz'

const OG_IMAGE_URL = `${SITE_ORIGIN}/og-image.png`

interface SeoOptions {
    title: string
    description: string
    path: `/${string}` | '/'
    structuredData?: object
}

export function getLocalizedPath(path: SeoOptions['path'], locale: Locale): string {
    if (locale === 'cs') {
        return path
    }

    return path === '/' ? '/en/' : `/en${path}`
}

export function getLocalizedUrl(path: SeoOptions['path'], locale: Locale): string {
    return `${SITE_ORIGIN}${getLocalizedPath(path, locale)}`
}

export function createSeoHead(options: SeoOptions, locale: Locale = getLocale()) {
    const canonicalUrl = getLocalizedUrl(options.path, locale)
    const alternateLocale = locale === 'cs' ? 'en' : 'cs'
    const imageAlt = locale === 'cs' ? 'Jan Drlý, full-stack vývojář' : 'Jan Drlý, full-stack developer'

    return {
        meta: [
            { title: options.title },
            { name: 'description', content: options.description },
            { name: 'robots', content: 'index, follow, max-image-preview:large' },
            { property: 'og:type', content: 'website' },
            { property: 'og:url', content: canonicalUrl },
            { property: 'og:title', content: options.title },
            { property: 'og:description', content: options.description },
            { property: 'og:image', content: OG_IMAGE_URL },
            { property: 'og:image:width', content: '1200' },
            { property: 'og:image:height', content: '630' },
            { property: 'og:image:alt', content: imageAlt },
            { property: 'og:site_name', content: 'Jan Drlý' },
            { property: 'og:locale', content: locale === 'cs' ? 'cs_CZ' : 'en_US' },
            { property: 'og:locale:alternate', content: alternateLocale === 'cs' ? 'cs_CZ' : 'en_US' },
            { name: 'twitter:card', content: 'summary_large_image' },
            { name: 'twitter:title', content: options.title },
            { name: 'twitter:description', content: options.description },
            { name: 'twitter:image', content: OG_IMAGE_URL },
            { name: 'twitter:image:alt', content: imageAlt },
        ],
        links: [
            { rel: 'canonical', href: canonicalUrl },
            { rel: 'alternate', hrefLang: 'cs', href: getLocalizedUrl(options.path, 'cs') },
            { rel: 'alternate', hrefLang: 'en', href: getLocalizedUrl(options.path, 'en') },
            { rel: 'alternate', hrefLang: 'x-default', href: getLocalizedUrl(options.path, 'cs') },
        ],
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

export function createHomeStructuredData(description: string) {
    return {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'WebSite',
                '@id': `${SITE_ORIGIN}/#website`,
                url: `${SITE_ORIGIN}/`,
                name: 'Jan Drlý',
                alternateName: 'Jandrly',
                description,
                inLanguage: ['cs-CZ', 'en-US'],
            },
            {
                '@type': 'Person',
                '@id': `${SITE_ORIGIN}/#person`,
                name: 'Jan Drlý',
                url: `${SITE_ORIGIN}/`,
                image: `${SITE_ORIGIN}/images/jd-portrait.avif`,
                jobTitle: 'Full-stack developer',
                email: 'mailto:jd@jandrly.cz',
                telephone: '+420735190454',
                address: {
                    '@type': 'PostalAddress',
                    addressLocality: 'Pardubice',
                    addressCountry: 'CZ',
                },
                sameAs: ['https://www.facebook.com/jandrly.cz', 'https://www.linkedin.com/in/jandrly/', 'https://github.com/jdrly'],
            },
        ],
    }
}
