import { Link } from '@tanstack/react-router'

interface SocialLink {
    label: string
    href: string
}

const socialLinks: SocialLink[] = [
    { label: 'Facebook', href: '#' },
    { label: 'LinkedIn', href: '#' },
    { label: 'GitHub', href: '#' },
]

export function Footer() {
    const currentYear = new Date().getFullYear()

    return (
        <footer className="border-t border-bg-elevated bg-bg px-6 py-20">
            <div className="mx-auto flex max-w-7xl flex-col items-center text-center">
                {/* Large Decorative Name */}
                <h2 className="pointer-events-none mb-10 select-none text-[10vw] font-bold leading-none text-bg-elevated">
                    JAN DRLÝ
                </h2>

                {/* Social Links */}
                <div className="flex flex-wrap justify-center gap-8 text-text-muted">
                    {socialLinks.map((link) => (
                        <a
                            key={link.label}
                            href={link.href}
                            className="transition-colors hover:text-white"
                        >
                            {link.label}
                        </a>
                    ))}
                </div>

                {/* Copyright and Privacy */}
                <div className="mt-12 flex w-full max-w-sm flex-col items-center justify-between gap-6 text-sm text-[#444444] md:flex-row">
                    <p>© {currentYear} Jan Drlý.</p>
                    <div className="flex gap-4">
                        <Link
                            to="/privacy"
                            className="transition-colors hover:text-white"
                        >
                            Privacy
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
