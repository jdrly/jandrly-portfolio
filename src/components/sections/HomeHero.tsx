import { Link } from '@tanstack/react-router'
import { preload } from 'react-dom'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { ProtectedEmail } from '@/components/ProtectedEmail'
import { MobileMenuToggle } from '@/components/layout/Navbar'
import { NAV_ACTIVE_OPTIONS, NAV_ITEMS } from '@/components/layout/navItems'
import { Wordmark } from '@/components/layout/Wordmark'
import { Barcode } from '@/components/ui/Barcode'
import { ButtonLink } from '@/components/ui/Button'
import { GlyphName } from '@/components/ui/GlyphName'
import { NamePlate } from '@/components/ui/NamePlate'
import { Sparkles } from '@/components/ui/Sparkles'
import { HERO_PORTRAIT, HOME_CONTENT_ID } from '@/components/sections/homeHeroConstants'
import { SITE } from '@/lib/site'
import * as m from '@/paraglide/messages'

const SPEC_RULE = '- - - - - - - - - - - - - - -'

/** Pseudo-SQL keys are padded so the values line up in the monospace columns. */
const pad = (key: string, width: number) => key.padEnd(width, ' ')

const SPEC_LINE_CLASS = 'whitespace-pre-wrap'

function StatusLines() {
    return (
        <div>
            <p className={SPEC_LINE_CLASS}>
                {pad('STATUS', 9)}= {m.home_hero_spec_status()}
            </p>
            <p className={SPEC_LINE_CLASS}>
                {pad(m.home_hero_spec_capacity_key(), 9)}= {m.home_hero_spec_capacity()}
            </p>
            <p className={SPEC_LINE_CLASS}>
                {pad('E-MAIL', 9)}={' '}
                <ProtectedEmail className="underline decoration-transparent underline-offset-2 transition-colors duration-200 hover:decoration-current" />
                ;
            </p>
        </div>
    )
}

const HERO_SERVICES = [
    { index: '01', label: m.home_hero_service_1 },
    { index: '02', label: m.home_hero_service_2 },
    { index: '03', label: m.home_hero_service_3 },
    { index: '04', label: m.home_hero_service_4 },
] as const

function ServiceLines({ items, className }: { items: ReadonlyArray<(typeof HERO_SERVICES)[number]>; className?: string }) {
    return (
        <ul className={className}>
            {items.map((item) => (
                <li key={item.index} className={`${SPEC_LINE_CLASS} uppercase`}>
                    {pad(item.index, 4)}
                    {item.label()}
                </li>
            ))}
        </ul>
    )
}

function SpecRule() {
    return (
        <p aria-hidden="true" className="overflow-hidden whitespace-nowrap text-ink-soft">
            {SPEC_RULE}
        </p>
    )
}

/** Desktop: two pseudo-SQL columns (query + services 01–02, status + services 03–04). */
function SpecColumns() {
    return (
        <div className="hidden grid-cols-1 gap-x-10 gap-y-6 font-mono text-[0.8125rem] leading-normal tracking-[0.0125rem] text-ink lg:grid xl:grid-cols-2">
            <div className="flex flex-col gap-2.5">
                <div>
                    <p className={SPEC_LINE_CLASS}>
                        {pad('SELECT', 8)}
                        {m.home_hero_spec_services()}
                    </p>
                    <p className={SPEC_LINE_CLASS}>
                        {pad('FROM', 8)}
                        {SITE.domain}
                    </p>
                    <p className={SPEC_LINE_CLASS}>
                        {pad('WHERE', 8)}
                        {m.home_hero_spec_where()}
                    </p>
                </div>
                <SpecRule />
                <ServiceLines items={HERO_SERVICES.slice(0, 2)} />
            </div>
            <div className="flex flex-col gap-2.5">
                <StatusLines />
                <SpecRule />
                <ServiceLines items={HERO_SERVICES.slice(2)} />
            </div>
        </div>
    )
}

/** Mobile: one ruled block — status lines, then all four services. */
function SpecBlock() {
    return (
        <div className="flex flex-col gap-2.5 border-y-[1.5px] border-ink py-4 font-mono text-[0.75rem] leading-[1.55] tracking-[0.0125rem] text-ink lg:hidden">
            <StatusLines />
            <ServiceLines items={HERO_SERVICES} className="text-ink-soft" />
        </div>
    )
}

/** Desktop top row: indexed navigation (left) and the large wordmark with role + language switch (right). */
function HeroTopRow() {
    return (
        <div className="hidden items-start justify-between gap-8 lg:flex">
            <nav aria-label={m.nav_main_label()}>
                <ul className="flex flex-col gap-1.5">
                    {NAV_ITEMS.map((item) => (
                        <li key={item.index}>
                            <Link
                                to={item.to}
                                hash={item.hash}
                                activeOptions={NAV_ACTIVE_OPTIONS}
                                className="group flex items-center gap-3.5 font-mono leading-normal tracking-[0.0125rem]"
                            >
                                <span aria-hidden="true" className="text-[0.8125rem] text-ink-soft">
                                    {item.index}
                                </span>
                                <span className="border-b-[1.5px] border-transparent text-[0.875rem] font-semibold text-ink uppercase transition-colors duration-200 group-hover:border-ink group-data-[status=active]:border-ink">
                                    {item.label()}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="flex flex-col items-end gap-1">
                <Link to="/" aria-label={`${SITE.name} · ${m.nav_home()}`} className="flex flex-col items-end gap-1 text-ink">
                    <span className="font-display text-[2.5rem] leading-none font-black tracking-[-0.0375em]">JANDRLÝ</span>
                    <span aria-hidden="true" className="h-[3px] w-[calc(100%-2px)] rounded-[2px] bg-current" />
                </Link>
                <p className="font-mono text-[0.75rem] leading-normal tracking-[0.094rem] text-ink-soft uppercase">{m.home_hero_role()}</p>
                <LanguageSwitcher className="mt-1" />
            </div>
        </div>
    )
}

/**
 * Homepage hero. The design puts the site navigation inside the hero, so the index route hides the global
 * header (`staticData.hideHeader`).
 * ≥ lg: portrait (left) · info panel with nav, glyphs, headline, spec and CTA (right) · name plate across the bottom.
 * < lg: top bar (wordmark + menu) · portrait with the name plate · info stacked below.
 */
export function HomeHero() {
    // The portrait is the LCP element. React emits this preload at the top of <head>, ahead of the stylesheet and
    // the module preloads, so its download starts first. Browsers without AVIF skip it and load the WebP <img>.
    preload(HERO_PORTRAIT.avif, { as: 'image', type: 'image/avif', fetchPriority: 'high' })

    // Up to the 90rem page width the columns keep the design's 500 / 280 / 660 split. Wider than that, the portrait
    // column stretches to the viewport's left edge (50% − 13.75rem is 500px at 1440px) and a fourth, empty column keeps
    // the text column aligned with the rest of the page.
    return (
        <section aria-labelledby="home-heading" className="bg-grain overflow-hidden">
            <div className="relative mx-auto grid max-w-page grid-cols-1 grid-rows-[auto_27.5rem_auto] md:grid-rows-[auto_min(110vw,56rem)_auto] lg:grid-cols-[minmax(0,500fr)_minmax(0,280fr)_minmax(0,660fr)] lg:grid-rows-[1fr_auto] min-[90rem]:max-w-none min-[90rem]:grid-cols-[calc(50%-13.75rem)_17.5rem_41.25rem_minmax(0,1fr)]">
                <div className="col-start-1 row-start-1 flex items-center justify-between gap-6 px-gutter py-3.5 lg:hidden">
                    <Wordmark />
                    <MobileMenuToggle />
                </div>

                <div className="relative col-start-1 row-start-2 overflow-hidden lg:col-[1/3] lg:row-[1/3]">
                    <picture>
                        <source type="image/avif" srcSet={HERO_PORTRAIT.avif} />
                        <img
                            src={HERO_PORTRAIT.webp}
                            width={HERO_PORTRAIT.width}
                            height={HERO_PORTRAIT.height}
                            alt={m.home_hero_portrait_alt()}
                            fetchPriority="high"
                            className="absolute inset-0 size-full object-cover"
                        />
                    </picture>
                </div>

                <NamePlate
                    meta={[m.nameplate_company_id(), m.nameplate_disciplines()]}
                    className="relative z-10 col-start-1 row-start-2 ml-[11.2821vw] self-end md:ml-11 lg:col-[1/4] lg:ml-[12%] xl:col-[2/4] xl:ml-0"
                />

                <div className="relative z-10 col-start-1 row-start-3 flex min-w-0 flex-col gap-[26px] px-gutter pt-7 pb-11 lg:col-start-3 lg:row-start-1 lg:gap-10 lg:pt-16 lg:pr-[min(4.7222vw,4.25rem)] lg:pb-[17px] lg:pl-5">
                    <span
                        aria-hidden="true"
                        className="pointer-events-none absolute top-7 right-[min(1.9444vw,1.75rem)] bottom-0 -left-5 hidden border-t-[1.5px] border-r-[1.5px] border-line lg:block"
                    />

                    <HeroTopRow />

                    <div className="flex flex-col gap-[26px] lg:items-end lg:gap-5">
                        <GlyphName className="lg:text-[clamp(2.75rem,6.25vw-1.25rem,4rem)]" />
                        <div className="flex w-full items-center justify-between gap-6">
                            <Barcode className="h-7 w-[127px] lg:h-10 lg:w-[173px]" />
                            <Sparkles variant="level" className="w-[84px] lg:hidden" />
                            <Sparkles className="hidden lg:block" />
                        </div>
                    </div>

                    <div id={HOME_CONTENT_ID} tabIndex={-1} className="flex scroll-mt-4 flex-col gap-3.5 focus:outline-none lg:gap-[18px]">
                        <p className="font-mono text-[0.75rem] leading-normal font-semibold tracking-[0.0625rem] text-teal-ink uppercase lg:text-[0.8125rem] lg:tracking-[0.075rem]">
                            {m.home_hero_eyebrow()}
                        </p>
                        <h1 id="home-heading" className="text-h3 text-ink">
                            {m.home_hero_title()}
                        </h1>
                        <p className="text-body leading-normal text-ink-soft lg:max-w-[30rem]">{m.home_hero_lead()}</p>
                    </div>

                    <SpecColumns />
                    <SpecBlock />

                    <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-center lg:gap-5 xl:gap-7">
                        <div
                            aria-hidden="true"
                            className="flex items-center gap-5 font-mono leading-[1.2] font-medium tracking-[0.0125rem] text-ink lg:flex-1 lg:leading-normal xl:gap-7"
                        >
                            <span className="size-2.5 shrink-0 rounded-full bg-ink xl:size-3.5" />
                            <span className="text-[1.125rem] xl:text-[1.375rem]">H.01</span>
                            <span className="text-[1.125rem] xl:text-[1.375rem]">CZ.26</span>
                        </div>
                        <ButtonLink
                            variant="dark"
                            to="/contact"
                            iconClassName="size-5 lg:size-[18px]"
                            className="w-full justify-between px-[22px] py-[18px] leading-[1.2] tracking-[0.075rem] lg:w-auto lg:justify-center lg:px-6 lg:py-4 lg:leading-normal lg:tracking-[0.0625rem]"
                        >
                            {m.cta_button()}
                        </ButtonLink>
                    </div>
                </div>
            </div>
        </section>
    )
}
