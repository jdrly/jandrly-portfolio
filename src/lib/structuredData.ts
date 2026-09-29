import * as m from '../paraglide/messages'
import { getLocale } from '../paraglide/runtime'
import { getLocalizedUrl } from './seo'
import { SITE, TECH_STACK } from './site'
import type { IndexedPage } from './seo'
import type { Locale } from '../paraglide/runtime'

/**
 * JSON-LD graph for every indexed page (schema.org, linked by `@id`):
 * WebSite, Person (Jan Drlý), Organization (the "Jandrly" trade name of his sole-trader business), the page
 * itself (WebPage / AboutPage + ProfilePage / ContactPage), a BreadcrumbList on subpages and an OfferCatalog of
 * Service entries on the services page. The shared nodes are identical on every page of a locale.
 * No e-mail address (anti-spam) and no ratings or reviews.
 */

const IDS = {
    website: `${SITE.origin}/#website`,
    person: `${SITE.origin}/#person`,
    business: `${SITE.origin}/#business`,
} as const

/** Remote work for clients in Czechia, Slovakia and the rest of Europe. Language-neutral, so both locales state the same facts. */
const AREA_SERVED = [
    { '@type': 'Country', name: 'Czechia', identifier: 'CZ' },
    { '@type': 'Country', name: 'Slovakia', identifier: 'SK' },
    { '@type': 'Continent', name: 'Europe' },
] as const

const KNOWS_LANGUAGE = ['cs', 'en'] as const

const KNOWS_ABOUT = [
    'Full-stack web development',
    'Custom web application development',
    'API integration',
    'Backend development',
    'Business process automation',
    'Content management systems',
    'iOS and macOS app development',
    'TypeScript',
    ...TECH_STACK,
] as const

type PageKind = 'home' | 'about' | 'services' | 'contact' | 'privacy'

const PAGE_KIND: Record<IndexedPage, PageKind> = {
    '/': 'home',
    '/about': 'about',
    '/services': 'services',
    '/contact': 'contact',
    '/privacy': 'privacy',
}

const PAGE_TYPE: Record<PageKind, string | Array<string>> = {
    home: 'WebPage',
    about: ['AboutPage', 'ProfilePage'],
    services: 'WebPage',
    contact: 'ContactPage',
    privacy: 'WebPage',
}

function breadcrumbName(kind: Exclude<PageKind, 'home'>, locale: Locale) {
    const names = {
        about: m.nav_about,
        services: m.nav_services,
        contact: m.nav_contact,
        privacy: m.footer_privacy,
    } as const
    return names[kind]({}, { locale })
}

/** Service areas of the services page, in page order. */
function getServices(locale: Locale) {
    return [
        [m.services_area_webapp_title, m.services_area_webapp_desc],
        [m.services_area_backend_title, m.services_area_backend_desc],
        [m.services_area_automation_title, m.services_area_automation_desc],
        [m.services_area_web_title, m.services_area_web_desc],
        [m.services_area_apps_title, m.services_area_apps_desc],
        [m.services_area_consulting_title, m.services_area_consulting_desc],
    ].map(([title, description]) => ({ name: title({}, { locale }), description: description({}, { locale }) }))
}

interface PageGraphOptions {
    path: IndexedPage
    title: string
    description: string
}

export function createPageStructuredData({ path, title, description }: PageGraphOptions, locale: Locale = getLocale()) {
    const kind = PAGE_KIND[path]
    const homeUrl = getLocalizedUrl('/', locale)
    const pageUrl = getLocalizedUrl(path, locale)
    const pageId = `${pageUrl}#webpage`
    const breadcrumbId = `${pageUrl}#breadcrumb`
    const catalogId = `${pageUrl}#services`

    const website = {
        '@type': 'WebSite',
        '@id': IDS.website,
        url: `${SITE.origin}/`,
        name: SITE.name,
        alternateName: SITE.alternateName,
        inLanguage: [...KNOWS_LANGUAGE],
        publisher: { '@id': IDS.person },
    }

    const person = {
        '@type': 'Person',
        '@id': IDS.person,
        name: SITE.name,
        url: homeUrl,
        image: `${SITE.origin}${SITE.portraitPath}`,
        jobTitle: m.home_hero_role({}, { locale }),
        worksFor: { '@id': IDS.business },
        knowsAbout: [...KNOWS_ABOUT],
        knowsLanguage: [...KNOWS_LANGUAGE],
        telephone: SITE.phone.e164,
        address: {
            '@type': 'PostalAddress',
            addressLocality: SITE.address.locality,
            addressCountry: SITE.address.country,
        },
        sameAs: Object.values(SITE.socials),
    }

    const business = {
        '@type': 'Organization',
        '@id': IDS.business,
        name: SITE.alternateName,
        legalName: SITE.name,
        url: homeUrl,
        logo: { '@type': 'ImageObject', url: `${SITE.origin}/icon-512.png`, width: 512, height: 512 },
        description: m.meta_home_description({}, { locale }),
        founder: { '@id': IDS.person },
        identifier: { '@type': 'PropertyValue', propertyID: 'IČO', value: SITE.companyId },
        areaServed: AREA_SERVED,
        knowsAbout: [...KNOWS_ABOUT],
        knowsLanguage: [...KNOWS_LANGUAGE],
        contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'sales',
            telephone: SITE.phone.e164,
            url: getLocalizedUrl('/contact', locale),
            availableLanguage: [...KNOWS_LANGUAGE],
            areaServed: AREA_SERVED,
        },
        ...(kind === 'services' ? { hasOfferCatalog: { '@id': catalogId } } : {}),
    }

    const page = {
        '@type': PAGE_TYPE[kind],
        '@id': pageId,
        url: pageUrl,
        name: title,
        description,
        inLanguage: locale,
        isPartOf: { '@id': IDS.website },
        ...(kind === 'about' ? { mainEntity: { '@id': IDS.person } } : { about: { '@id': IDS.business } }),
        ...(kind === 'services' ? { mainEntity: { '@id': catalogId } } : {}),
        ...(kind === 'home' ? {} : { breadcrumb: { '@id': breadcrumbId } }),
    }

    const breadcrumb =
        kind === 'home'
            ? []
            : [
                  {
                      '@type': 'BreadcrumbList',
                      '@id': breadcrumbId,
                      itemListElement: [
                          { '@type': 'ListItem', position: 1, name: m.nav_home({}, { locale }), item: homeUrl },
                          { '@type': 'ListItem', position: 2, name: breadcrumbName(kind, locale), item: pageUrl },
                      ],
                  },
              ]

    const catalog =
        kind === 'services'
            ? [
                  {
                      '@type': 'OfferCatalog',
                      '@id': catalogId,
                      name: m.nav_services({}, { locale }),
                      itemListElement: getServices(locale).map((service) => ({
                          '@type': 'Offer',
                          itemOffered: {
                              '@type': 'Service',
                              name: service.name,
                              serviceType: service.name,
                              description: service.description,
                              provider: { '@id': IDS.business },
                              areaServed: AREA_SERVED,
                          },
                      })),
                  },
              ]
            : []

    return {
        '@context': 'https://schema.org',
        '@graph': [website, person, business, page, ...breadcrumb, ...catalog],
    }
}
