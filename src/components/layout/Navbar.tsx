import { useCallback, useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { Menu } from 'lucide-react'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { MENU_BUTTON_CLASS, MobileMenu } from '@/components/layout/MobileMenu'
import { NAV_ACTIVE_OPTIONS, NAV_ITEMS } from '@/components/layout/navItems'
import { Wordmark } from '@/components/layout/Wordmark'
import { ButtonLink } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import * as m from '@/paraglide/messages'

const MOBILE_MENU_ID = 'mobile-menu'

function selectHref(location: { href: string }) {
    return location.href
}

/**
 * Site header. ≥ lg: Nav / Desktop (wordmark · indexed links · language · CTA);
 * < lg: Nav / Mobile (wordmark · menu button opening the MobileMenu dialog).
 */
export function Navbar() {
    return (
        <header className="bg-grain border-b-[1.5px] border-ink">
            <div data-reveal="fade-down" className="container-page flex items-center justify-between gap-6 py-3.5 lg:py-[22px]">
                <Wordmark />

                <nav aria-label={m.nav_main_label()} className="hidden lg:block">
                    <ul className="flex items-center gap-6 xl:gap-9">
                        {NAV_ITEMS.map((item) => (
                            <li key={item.index}>
                                <Link
                                    to={item.to}
                                    hash={item.hash}
                                    activeOptions={NAV_ACTIVE_OPTIONS}
                                    className="flex items-center gap-2.5 border-b-2 border-transparent py-1.5 font-mono transition-colors duration-200 hover:border-ink-soft data-[status=active]:border-ink"
                                >
                                    <span aria-hidden="true" className="text-label font-normal text-ink-soft">
                                        {item.index}
                                    </span>
                                    <span
                                        data-scramble-hover=""
                                        className="text-[0.875rem] leading-[1.3] font-semibold tracking-[0.0625rem] text-ink uppercase"
                                    >
                                        {item.label()}
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="hidden items-center gap-5 lg:flex xl:gap-7">
                    <LanguageSwitcher />
                    <ButtonLink variant="dark" size="sm" to="/contact">
                        {m.cta_button()}
                    </ButtonLink>
                </div>

                <MobileMenuToggle />
            </div>
        </header>
    )
}

/**
 * Nav / Mobile menu button plus the MobileMenu dialog it opens (hidden from `lg`). Exported so pages that
 * render their own header (the homepage hero) reuse the same mobile navigation.
 */
export function MobileMenuToggle() {
    const href = useLocation({ select: selectHref })
    // The menu is open only for the location it was opened on, so any navigation (links, back/forward) closes it.
    const [openedAt, setOpenedAt] = useState<string | null>(null)
    const isMenuOpen = openedAt === href
    const closeMenu = useCallback(() => setOpenedAt(null), [])

    return (
        <>
            <button
                type="button"
                className={cn(MENU_BUTTON_CLASS, 'lg:hidden')}
                aria-label={m.nav_menu_open()}
                aria-expanded={isMenuOpen}
                aria-controls={MOBILE_MENU_ID}
                aria-haspopup="dialog"
                onClick={() => setOpenedAt(href)}
            >
                <Menu aria-hidden="true" className="size-5" />
            </button>
            <MobileMenu id={MOBILE_MENU_ID} isOpen={isMenuOpen} onClose={closeMenu} />
        </>
    )
}
