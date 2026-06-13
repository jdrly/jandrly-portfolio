import { Link } from '@tanstack/react-router'
import { BrandIcon } from '@/components/SocialLinks'
import { socialLinks } from '@/lib/socialLinks'
import * as m from '@/paraglide/messages'
import { localizeHref } from '@/paraglide/runtime'

export function Footer() {
    const currentYear = new Date().getFullYear()

    return (
        <footer className="border-t border-bg-elevated bg-bg px-4 pb-24 pt-12 sm:px-6 sm:pb-28 sm:pt-20">
            <div className="mx-auto flex max-w-7xl flex-col items-center text-center">
                {/* Large Decorative Name */}
                <h2 className="pointer-events-none mb-6 select-none text-[12vw] font-bold leading-none text-bg-elevated sm:mb-10 sm:text-[10vw] uppercase">
                    Jan Drlý
                </h2>

                {/* Social Links */}
                <div className="flex flex-wrap justify-center gap-4 text-text-muted sm:gap-8">
                    {socialLinks.map((link) => (
                        <a
                            key={link.label}
                            href={link.href}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 transition-colors hover:text-white"
                        >
                            <BrandIcon icon={link.icon} />
                            {link.label}
                        </a>
                    ))}
                </div>

                {/* Copyright and Privacy */}
                <div className="mt-8 flex flex-col-reverse items-center justify-center gap-4 text-xs text-[#444444] sm:mt-12 sm:gap-8 sm:text-sm md:flex-row">
                    <p className="whitespace-nowrap">{m.footer_copyright({ year: currentYear })}</p>
                    <div className="flex gap-4 whitespace-nowrap">
                        <Link to={localizeHref('/privacy')} className="transition-colors hover:text-white">
                            {m.footer_privacy()}
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
