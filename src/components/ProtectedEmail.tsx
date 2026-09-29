import { useSyncExternalStore } from 'react'
import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { CONTACT_EMAIL_PLACEHOLDER, assembleContactEmail } from '@/lib/contact'
import { localizeHref } from '@/paraglide/runtime'

const subscribe = () => () => {}

/** `false` during SSR and hydration, `true` afterwards. */
function useIsHydrated() {
    return useSyncExternalStore(
        subscribe,
        () => true,
        () => false,
    )
}

export interface ProtectedEmailState {
    /** `mailto:` link once hydrated; the contact page before that (works without JS). */
    href: string
    /** Real address once hydrated, `jd [at] jandrly.cz` in the server HTML. */
    display: string
    isRevealed: boolean
}

/**
 * Keeps the email address out of the server-rendered HTML (and so out of reach
 * of simple scrapers). The real `mailto:` link is only assembled in the browser.
 */
export function useProtectedEmail(): ProtectedEmailState {
    const isRevealed = useIsHydrated()

    if (!isRevealed) {
        return { href: localizeHref('/contact'), display: CONTACT_EMAIL_PLACEHOLDER, isRevealed }
    }

    const address = assembleContactEmail()

    return { href: `mailto:${address}`, display: address, isRevealed }
}

type ProtectedEmailProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
    /** Custom label; defaults to the (protected) address itself. */
    children?: ReactNode
}

export function ProtectedEmail({ children, ...anchorProps }: ProtectedEmailProps) {
    const { href, display } = useProtectedEmail()

    return (
        <a {...anchorProps} href={href}>
            {children ?? display}
        </a>
    )
}
