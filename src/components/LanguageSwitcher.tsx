import { useLocation } from '@tanstack/react-router'
import { Globe } from 'lucide-react'
import type { Locale } from '@/paraglide/runtime'
import * as m from '@/paraglide/messages'
import { baseLocale, cookieMaxAge, cookieName, getLocale } from '@/paraglide/runtime'

/**
 * Build the target URL for language switching.
 * - For base locale (cs): strip /en/ prefix, use root path
 * - For other locales (en): add /{locale}/ prefix
 */
function buildLocalizedPath(pathname: string, targetLocale: Locale): string {
    // Remove any existing locale prefix (/en/) to get the base path
    const basePath = pathname.replace(/^\/en(?=\/|$)/, '') || '/'

    if (targetLocale === baseLocale) {
        // Czech (base locale) uses root URLs without prefix
        return basePath
    }
    // Other locales (English) use /{locale}/path
    return `/${targetLocale}${basePath}`
}

/**
 * Set the locale cookie before navigation to ensure server-side locale detection works.
 * This is necessary because the URL strategy may not be active in the runtime,
 * and the server relies on the cookie to determine the locale.
 */
function handleLanguageSwitch(targetLocale: Locale) {
    // Set the cookie BEFORE navigation so the server reads the correct locale
    document.cookie = `${cookieName}=${targetLocale}; path=/; max-age=${cookieMaxAge}; SameSite=Lax`
    // Let the default anchor navigation proceed to the new URL
    // The cookie is now set, so server will detect the correct locale
}

export function LanguageSwitcher() {
    const location = useLocation()
    const currentLocale = getLocale()
    const targetLocale: Locale = currentLocale === 'cs' ? 'en' : 'cs'

    const targetPath = buildLocalizedPath(location.pathname, targetLocale)

    return (
        <a
            href={targetPath}
            onClick={() => handleLanguageSwitch(targetLocale)}
            className="group relative flex items-center gap-2 rounded-full border border-border bg-bg-card/80 px-3 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all hover:border-accent hover:bg-bg-elevated"
            aria-label={m.language_switcher_label()}
        >
            <Globe size={16} className="text-text-muted group-hover:text-accent" />
            <span className="uppercase">{currentLocale}</span>
        </a>
    )
}

export function LanguageSwitcherMinimal() {
    const location = useLocation()
    const currentLocale = getLocale()
    const targetLocale: Locale = currentLocale === 'cs' ? 'en' : 'cs'

    const targetPath = buildLocalizedPath(location.pathname, targetLocale)

    return (
        <a
            href={targetPath}
            onClick={() => handleLanguageSwitch(targetLocale)}
            className="group relative rounded-full p-2 text-white transition-colors hover:bg-bg-elevated sm:p-3"
            aria-label={m.language_switcher_label()}
        >
            <Globe size={20} />
            <span className="pointer-events-none absolute -top-10 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-bg-elevated px-3 py-1 text-xs opacity-0 transition-opacity group-hover:opacity-100 sm:block">
                {currentLocale === 'cs' ? m.lang_en() : m.lang_cs()}
            </span>
        </a>
    )
}
