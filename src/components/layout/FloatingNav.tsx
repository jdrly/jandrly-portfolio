import { Link } from '@tanstack/react-router'
import { Box, LayoutGrid, User } from 'lucide-react'
import * as m from '@/paraglide/messages'
import { localizeHref } from '@/paraglide/runtime'
import { LanguageSwitcherMinimal } from '@/components/LanguageSwitcher'

interface NavItem {
    labelKey: () => string
    to: string
    icon: React.ReactNode
}

function useNavItems(): Array<NavItem> {
    return [
        { labelKey: m.nav_home, to: '/', icon: <LayoutGrid size={20} aria-hidden="true" /> },
        { labelKey: m.nav_about, to: '/about', icon: <User size={20} aria-hidden="true" /> },
        { labelKey: m.nav_services, to: '/services', icon: <Box size={20} aria-hidden="true" /> },
    ]
}

export function FloatingNav() {
    const navItems = useNavItems()

    return (
        <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center rounded-full border border-border bg-bg-card/90 p-1 shadow-2xl backdrop-blur-md sm:bottom-8 sm:p-1.5">
            {/* Navigation Icons */}
            <div className="flex items-center gap-0.5 border-r border-border px-1 sm:gap-1 sm:px-2">
                {navItems.map((item) => (
                    <Link
                        key={item.to}
                        to={localizeHref(item.to)}
                        aria-label={item.labelKey()}
                        className="group relative rounded-full p-2 text-white transition-colors hover:bg-bg-elevated sm:p-3"
                    >
                        {item.icon}
                        {/* Tooltip - hidden on mobile */}
                        <span
                            className="pointer-events-none absolute -top-10 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-bg-elevated px-3 py-1 text-xs opacity-0 transition-opacity group-hover:opacity-100 sm:block"
                            aria-hidden="true"
                        >
                            {item.labelKey()}
                        </span>
                    </Link>
                ))}
                <LanguageSwitcherMinimal />
            </div>

            {/* Contact Button */}
            <div className="pl-2 pr-1 sm:pl-5 sm:pr-2">
                <Link
                    to={localizeHref('/contact')}
                    className="block rounded-full bg-accent px-3 py-2 text-xs font-bold uppercase tracking-wide text-black transition-colors hover:bg-accent-hover sm:px-5 sm:py-2.5 sm:text-sm"
                >
                    {m.nav_contact()}
                </Link>
            </div>
        </div>
    )
}
