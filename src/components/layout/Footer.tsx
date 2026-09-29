import { Link } from '@tanstack/react-router'
import { BrandIcon } from '@/components/SocialLinks'
import { GlyphWord } from '@/components/ui/GlyphWord'
import { GLYPH_WORDS } from '@/components/ui/glyphWords'
import { Sparkles } from '@/components/ui/Sparkles'
import { socialLinks } from '@/lib/socialLinks'
import * as m from '@/paraglide/messages'

const FOOTER_NAME = 'JAN DRLÝ'

/**
 * Footer — ink grain band with the giant name, glyph script + sparkles, social links and legal line.
 * Footer / Desktop (≥ lg bottom row, ≥ xl top row) and Footer / Mobile merged into one responsive tree.
 */
export function Footer() {
    const currentYear = new Date().getFullYear()

    return (
        <footer className="bg-grain-dark text-paper">
            <div className="container-page flex flex-col gap-7 pt-12 pb-8 lg:gap-10 lg:pt-16 lg:pb-10">
                <div className="flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between xl:gap-10">
                    {/* The letters rise out of their mask as the footer scrolls into view (scroll-linked). */}
                    <p className="font-display text-display-2xl text-paper">
                        <span className="sr-only">{FOOTER_NAME}</span>
                        <span aria-hidden="true" data-scroll="rise-chars" className="reveal-mask inline-flex">
                            {Array.from(FOOTER_NAME).map((char, index) => (
                                <span key={index} data-char="" className="inline-block whitespace-pre">
                                    {char}
                                </span>
                            ))}
                        </span>
                    </p>
                    <div className="flex items-center justify-between gap-6 xl:flex-col xl:items-end xl:gap-3.5 xl:pb-3">
                        <GlyphWord glyphs={GLYPH_WORDS.name} className="text-[22px] text-on-dark-label xl:text-[26px]" />
                        <Sparkles variant="level" className="w-[70px] xl:w-[90px]" />
                    </div>
                </div>

                <div className="flex flex-col gap-4 border-t-[1.5px] border-line-dark pt-5 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:pt-6">
                    <ul
                        aria-label={m.footer_social_label()}
                        data-reveal="stagger"
                        className="flex flex-wrap items-center gap-x-6 gap-y-3 lg:gap-x-8"
                    >
                        {socialLinks.map((link) => (
                            <li key={link.label}>
                                <a
                                    href={link.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 font-mono text-label font-normal text-paper uppercase transition-colors duration-200 hover:text-on-dark-label"
                                >
                                    <BrandIcon icon={link.icon} className="size-4 shrink-0" />
                                    <span data-scramble-hover="">{link.label}</span>
                                    <span className="sr-only"> {m.opens_in_new_tab()}</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                    <p className="flex flex-col font-mono text-[0.75rem] leading-[1.6] tracking-[0.0625rem] text-on-dark uppercase lg:flex-row lg:gap-[0.6em]">
                        <span>{m.footer_copyright({ year: currentYear })}</span>
                        <span aria-hidden="true" className="hidden lg:inline">
                            ·
                        </span>
                        <Link
                            to="/privacy"
                            className="w-fit underline decoration-transparent underline-offset-4 transition-colors hover:text-paper hover:decoration-current"
                        >
                            {m.footer_privacy()}
                        </Link>
                    </p>
                </div>
            </div>
        </footer>
    )
}
