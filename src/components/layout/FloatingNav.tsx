import { Link } from '@tanstack/react-router'
import { LayoutGrid, Globe, Box, User } from 'lucide-react'

interface NavItem {
    label: string
    to: string
    icon: React.ReactNode
}

const navItems: NavItem[] = [
    { label: 'Home', to: '/', icon: <LayoutGrid size={20} /> },
    { label: 'Work', to: '/work', icon: <Globe size={20} /> },
    { label: 'Services', to: '/services', icon: <Box size={20} /> },
    { label: 'About', to: '/about', icon: <User size={20} /> },
]

export function FloatingNav() {
    return (
        <div className="fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center rounded-full border border-border bg-bg-card/90 p-1.5 shadow-2xl backdrop-blur-md">
            {/* Navigation Icons */}
            <div className="flex items-center gap-1 border-r border-border pl-2 pr-2">
                {navItems.map((item) => (
                    <Link
                        key={item.to}
                        to={item.to}
                        className="group relative rounded-full p-3 text-white transition-colors hover:bg-bg-elevated"
                    >
                        {item.icon}
                        {/* Tooltip */}
                        <span className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-bg-elevated px-3 py-1 text-xs opacity-0 transition-opacity group-hover:opacity-100">
                            {item.label}
                        </span>
                    </Link>
                ))}
            </div>

            {/* Contact Button */}
            <div className="pl-5 pr-2">
                <Link
                    to="/contact"
                    className="block rounded-full bg-accent px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-black transition-colors hover:bg-accent-hover"
                >
                    Contact
                </Link>
            </div>
        </div>
    )
}
