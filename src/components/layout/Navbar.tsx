import { useSyncExternalStore } from 'react'
import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import * as m from '@/paraglide/messages'
import { localizeHref } from '@/paraglide/runtime'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

interface NavLink {
    labelKey: () => string
    to: string
}

function useNavLinks(): Array<NavLink> {
    return [
        { labelKey: m.nav_about, to: '/about' },
        { labelKey: m.nav_services, to: '/services' },
        { labelKey: m.nav_contact, to: '/contact' },
    ]
}

const SCROLL_THRESHOLD_PX = 20

function subscribeToScroll(onStoreChange: () => void) {
    window.addEventListener('scroll', onStoreChange, { passive: true })

    return () => window.removeEventListener('scroll', onStoreChange)
}

function getIsScrolled() {
    return window.scrollY > SCROLL_THRESHOLD_PX
}

function getServerIsScrolled() {
    return false
}

export function Navbar() {
    const isScrolled = useSyncExternalStore(subscribeToScroll, getIsScrolled, getServerIsScrolled)
    const navLinks = useNavLinks()

    return (
        <nav
            className={cn(
                'fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 text-white text-sm font-medium transition-all duration-300',
                isScrolled ? 'bg-bg/90 backdrop-blur-md py-4 shadow-lg' : 'py-6',
            )}
        >
            <div className="flex items-center gap-8">
                {/* Logo */}
                <Link
                    to={localizeHref('/')}
                    className="flex h-8 w-8 items-center justify-center rounded bg-white text-lg font-bold text-black"
                >
                    JD
                </Link>

                {/* Navigation Links */}
                <div className="hidden items-center gap-8 text-gray-300 md:flex">
                    {navLinks.map((link) => (
                        <Link key={link.to} to={localizeHref(link.to)} className="transition-colors hover:text-white">
                            {link.labelKey()}
                        </Link>
                    ))}
                </div>
            </div>

            {/* Right Actions */}
            <div className="hidden items-center gap-4 md:flex">
                <LanguageSwitcher />
            </div>
        </nav>
    )
}
