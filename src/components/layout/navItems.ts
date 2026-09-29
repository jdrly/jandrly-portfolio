import * as m from '@/paraglide/messages'

export interface NavItem {
    index: string
    label: () => string
    to: '/about' | '/services' | '/' | '/contact'
    hash?: string
}

/** Primary navigation, shared by the desktop header and the mobile menu. Paths are localized by the router rewrite. */
export const NAV_ITEMS: ReadonlyArray<NavItem> = [
    { index: '01', label: m.nav_about, to: '/about' },
    { index: '02', label: m.nav_services, to: '/services' },
    { index: '03', label: m.nav_work, to: '/', hash: 'work' },
    { index: '04', label: m.nav_contact, to: '/contact' },
]

/** Hash links only count as active when the hash matches (so "Co stavím" is not active on the whole homepage). */
export const NAV_ACTIVE_OPTIONS = { includeHash: true } as const
