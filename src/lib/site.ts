/**
 * Facts about the site and its owner, shared by SEO metadata, the sitemap, the contact page, the
 * footer and the contact form server. Client-safe constants only. The e-mail address is deliberately
 * not here; see `lib/contact.ts`.
 */

const DOMAIN = 'jandrly.cz'

export const SITE = {
    domain: DOMAIN,
    /** Preferred (canonical) origin. */
    origin: `https://www.${DOMAIN}`,
    name: 'Jan Drlý',
    alternateName: 'Jandrly',
    jobTitle: 'Full-stack developer',
    /** Photo used in structured data. */
    portraitPath: '/images/jd-portrait.avif',
    phone: {
        /** Non-breaking spaces keep the number on one line. */
        display: '+420\u00A0735\u00A0190\u00A0454',
        e164: '+420735190454',
        href: 'tel:+420735190454',
    },
    /** Contact information only (contact page, structured data). Not a targeting signal: all work is remote. */
    address: { locality: 'Pardubice', country: 'CZ' },
    /** Czech business ID (IČO). */
    companyId: '17126916',
    socials: {
        facebook: 'https://www.facebook.com/jandrly.cz',
        linkedin: 'https://www.linkedin.com/in/jandrly/',
        github: 'https://github.com/jdrly',
    },
    /** Business directory listings, linked from the business in structured data (`sameAs`). */
    listings: {
        firmyCz: 'https://www.firmy.cz/detail/14079059-jan-drly-pardubice-polabiny.html',
    },
} as const

/** Technologies shown on the About page and listed in structured data (`knowsAbout`). */
export const TECH_STACK = ['React', 'Convex', 'Next.js', 'Laravel', 'NestJS', 'PostgreSQL', 'Vue.js', 'Payload CMS', 'HubSpot', 'SwiftUI'] as const
