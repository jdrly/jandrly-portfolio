import { useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

interface NavLink {
    label: string
    to: string
}

const navLinks: NavLink[] = [
    { label: 'Home', to: '/' },
    { label: 'About', to: '/about' },
    { label: 'Services', to: '/services' },
    { label: 'Contact', to: '/contact' },
    { label: 'Work', to: '/work' },
]

export function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false)

    useEffect(() => {
        function handleScroll() {
            setIsScrolled(window.scrollY > 20)
        }

        window.addEventListener('scroll', handleScroll, { passive: true })
        handleScroll()

        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <nav
            className={cn(
                'fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 text-white text-sm font-medium transition-all duration-300',
                isScrolled ? 'bg-bg/90 backdrop-blur-md py-4 shadow-lg' : 'py-6'
            )}
        >
            <div className="flex items-center gap-8">
                {/* Logo */}
                <Link
                    to="/"
                    className="flex h-8 w-8 items-center justify-center rounded bg-white text-lg font-bold text-black"
                >
                    JD
                </Link>

                {/* Navigation Links */}
                <div className="hidden items-center gap-8 text-gray-300 md:flex">
                    {navLinks.map((link) => (
                        <Link
                            key={link.to}
                            to={link.to}
                            className="transition-colors hover:text-white"
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>
            </div>

            {/* Right Actions - empty for now, can add later */}
            <div className="flex items-center gap-8"></div>
        </nav>
    )
}
