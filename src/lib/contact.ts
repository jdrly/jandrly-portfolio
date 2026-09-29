import { SITE } from './site'

/**
 * The public e-mail address. It is kept split so it never appears as a plain
 * `user@domain` string in server-rendered HTML; use `ProtectedEmail` /
 * `useProtectedEmail` to render it. Other contact details live in `lib/site.ts`.
 */
const CONTACT_EMAIL_PARTS = {
    user: 'jd',
    domain: SITE.domain,
} as const

/** Assembles the address at runtime. In the browser, only call this after hydration or on interaction. */
export function assembleContactEmail() {
    return `${CONTACT_EMAIL_PARTS.user}@${CONTACT_EMAIL_PARTS.domain}`
}

/** Scraper-unfriendly placeholder shown until the page is hydrated. */
export const CONTACT_EMAIL_PLACEHOLDER = `${CONTACT_EMAIL_PARTS.user} [at] ${CONTACT_EMAIL_PARTS.domain}`
