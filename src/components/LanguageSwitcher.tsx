import { useLocation } from '@tanstack/react-router'
import type { Locale } from '@/paraglide/runtime'
import { cn } from '@/lib/utils'
import * as m from '@/paraglide/messages'
import { cookieMaxAge, cookieName, deLocalizeHref, getLocale, localizeHref } from '@/paraglide/runtime'

/** Short visible codes; Czech uses the familiar "CZ". */
const LOCALE_CODES: Record<Locale, string> = { cs: 'CZ', en: 'EN' }

/** The current page in another locale, using Paraglide's URL patterns (see `vite.config.ts`). */
function buildLocalizedPath(pathname: string, targetLocale: Locale): string {
    return localizeHref(deLocalizeHref(pathname), { locale: targetLocale })
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
}

interface LanguageSwitcherProps {
    className?: string
}

/** Mono "EN" / "CZ" link to the current page in the other locale (full document navigation). */
export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
    const location = useLocation()
    const currentLocale = getLocale()
    const targetLocale: Locale = currentLocale === 'cs' ? 'en' : 'cs'
    const targetPath = buildLocalizedPath(location.pathname, targetLocale)
    const targetName = targetLocale === 'cs' ? m.lang_cs() : m.lang_en()

    return (
        <a
            href={targetPath}
            hrefLang={targetLocale}
            onClick={() => handleLanguageSwitch(targetLocale)}
            className={cn(
                'inline-flex items-center gap-2 border-b-2 border-transparent py-1.5 font-mono text-[0.875rem] leading-[1.3] font-semibold tracking-[0.0625rem] text-ink transition-colors hover:border-ink',
                className,
            )}
        >
            <span aria-hidden="true" className="font-normal text-ink-soft">
                {LOCALE_CODES[currentLocale]} /
            </span>
            {LOCALE_CODES[targetLocale]}
            <span className="sr-only">
                {' – '}
                <span lang={targetLocale}>{targetName}</span> ({m.language_switcher_label()})
            </span>
        </a>
    )
}
