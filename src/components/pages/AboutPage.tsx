import type { GlyphId } from '@/components/ui/GlyphWord'
import { LetsTalkSection } from '@/components/sections/LetsTalkSection'
import { ArrowLink } from '@/components/ui/ArrowLink'
import { Barcode } from '@/components/ui/Barcode'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { GlyphWord } from '@/components/ui/GlyphWord'
import { Sparkles } from '@/components/ui/Sparkles'
import { Stat } from '@/components/ui/Stat'
import { TechCell } from '@/components/ui/TechCell'
import { cn } from '@/lib/utils'
import { SITE, TECH_STACK } from '@/lib/site'
import { keepHyphenatedWords } from '@/lib/typography'
import * as m from '@/paraglide/messages'

/* Type styles of this page without a global token (desktop → mobile values from the design). */
/** "Kdo jsem." title: 72 → 44. */
const PROFILE_TITLE_CLASS = 'font-display text-[clamp(2.75rem,2.6667vw+2.1rem,4.5rem)] leading-[0.96] font-black tracking-[-0.035em]'
/** Profile intro: 34 → 24. */
const INTRO_CLASS = 'font-display text-[clamp(1.5rem,0.9524vw+1.2679rem,2.125rem)] leading-[1.17] font-extrabold tracking-[-0.022em]'
/** Glyph words in principle cards: 15 → 13. */
const GLYPH_SIZE_CLASS = 'gap-[0.31em] text-[clamp(0.8125rem,0.1905vw+0.7661rem,0.9375rem)]'

const GLYPHS = {
    hero: [4, 6, 3, 10],
    profile: [11, 10, 9],
    approach: [0, 12, 1, 2],
    stack: [3, 2, 13],
} as const satisfies Record<string, ReadonlyArray<GlyphId>>

/** Decorative glyph cells that complete the last row of the 3-column stack grid (≥ md); 10 items fill 2 columns exactly. */
const STACK_FILLERS: ReadonlyArray<ReadonlyArray<GlyphId>> = [
    [0, 1, 2],
    [12, 9, 7],
]

/** Hero barcode (the design's 165×36 variant of the default pattern). */
const HERO_BARS = [12, 3, 14, 3, 3, 5, 2, 4, 3, 2, 64, 6] as const

/*
 * Stats: 2×2 on mobile (left column flush left with a right rule), one ruled row of four on desktop
 * (first cell flush left, rules between cells).
 */
const STATS = [
    { code: 'S.01', value: '6', label: m.about_stat_years, className: 'border-r-[1.5px] pl-0 lg:pl-0' },
    { code: 'S.02', value: '32', label: m.about_stat_projects, className: 'pr-0 lg:border-r-[1.5px] lg:pr-7' },
    { code: 'S.03', value: '6', label: m.about_stat_lines, className: 'border-r-[1.5px] pl-0 lg:pl-7' },
    { code: 'S.04', value: '3', label: m.about_stat_coffee, className: 'pr-0 lg:pr-7' },
] as const

const BIO = [
    { index: 'P.01', text: m.about_bio_1 },
    { index: 'P.02', text: m.about_bio_2 },
    { index: 'P.03', text: m.about_bio_3 },
] as const

const CORNERS_TL_BR = 'rounded-tl-[22px] rounded-br-[22px] lg:rounded-tl-[28px] lg:rounded-br-[28px]'
const CORNERS_TR_BL = 'rounded-tr-[22px] rounded-bl-[22px] lg:rounded-tr-[28px] lg:rounded-bl-[28px]'

const PRINCIPLES: ReadonlyArray<{
    code: string
    glyphs: ReadonlyArray<GlyphId>
    title: () => string
    description: () => string
    corners: string
}> = [
    { code: 'Q.01', glyphs: [13, 5, 9], title: m.about_value_clean_title, description: m.about_value_clean_desc, corners: CORNERS_TL_BR },
    { code: 'Q.02', glyphs: [7, 4, 10], title: m.about_value_user_title, description: m.about_value_user_desc, corners: CORNERS_TR_BL },
    { code: 'Q.03', glyphs: [6, 8, 11, 12], title: m.about_value_perf_title, description: m.about_value_perf_desc, corners: CORNERS_TL_BR },
]

const TECH_ITEMS = TECH_STACK.map((name, index) => ({
    name,
    index: `T.${String(index + 1).padStart(2, '0')}`,
}))

function PortraitCard() {
    return (
        <div className="relative h-[380px] w-full shrink-0 overflow-hidden rounded-tl-[28px] border-x-[1.5px] border-t-[1.5px] border-ink md:h-auto md:w-[26rem] md:self-end md:aspect-5/6 lg:w-[min(31.25rem,40%)] lg:self-auto lg:rounded-tl-[36px]">
            <picture>
                <source type="image/avif" srcSet="/images/jd-portrait-illustrated.avif" />
                <img
                    src="/images/jd-portrait-illustrated.webp"
                    alt={m.about_portrait_alt()}
                    width={768}
                    height={1376}
                    fetchPriority="high"
                    decoding="async"
                    className="absolute inset-y-0 -left-[3%] h-full w-[106%] max-w-none object-cover lg:-left-[4%] lg:w-[108%]"
                />
            </picture>
            <div className="absolute top-4 right-2.5 flex flex-col items-end gap-[3px] rounded-tr-[10px] rounded-bl-[10px] border-[1.5px] border-ink bg-paper px-3 py-2 font-mono uppercase lg:top-6 lg:right-6 lg:gap-1 lg:rounded-tr-xl lg:rounded-bl-xl lg:px-3.5 lg:py-2.5">
                <p className="text-label text-ink">{SITE.name}</p>
                <p className="text-[0.75rem] leading-[1.3] tracking-[0.0375rem] text-ink-soft lg:tracking-[0.0625rem]">
                    {m.about_portrait_role()}
                </p>
            </div>
        </div>
    )
}

function HeroSection() {
    return (
        <section aria-labelledby="about-title" className="bg-grain">
            <div className="container-page pb-[clamp(3.5rem,3.8095vw+2.5714rem,6rem)]">
                <div className="flex flex-col gap-[22px] pt-7 lg:flex-row lg:items-end lg:gap-16 lg:pt-[72px]">
                    <div className="flex min-w-0 flex-1 flex-col gap-[22px] lg:gap-7 lg:pb-[72px]">
                        <Eyebrow tone="teal" glyphs={GLYPHS.hero}>
                            {m.about_hero_eyebrow()}
                        </Eyebrow>
                        <h1 id="about-title" className="text-h1 text-ink">
                            {m.about_hero_title()}
                        </h1>
                        <p className="text-page-lead max-w-[35rem] text-ink-soft">{m.about_hero_subtitle()}</p>
                        <div aria-hidden="true" className="hidden items-center gap-7 lg:flex">
                            <Barcode bars={HERO_BARS} height={36} className="h-9 w-[165px]" />
                            <Sparkles variant="level" className="w-[100px] text-teal" />
                        </div>
                    </div>
                    <PortraitCard />
                </div>

                <ul
                    aria-label={m.about_stats_label()}
                    className="grid grid-cols-2 border-t-[1.5px] border-ink lg:grid-cols-4 lg:border-b-[1.5px]"
                >
                    {STATS.map((stat) => (
                        <li key={stat.code} className="flex">
                            <Stat
                                code={stat.code}
                                value={stat.value}
                                label={stat.label()}
                                className={cn('flex-1 border-b-[1.5px] lg:border-b-0', stat.className)}
                            />
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    )
}

function ProfileSection() {
    return (
        <section aria-labelledby="about-profile-title" className="bg-grain">
            <div className="container-page flex flex-col gap-6 pt-section pb-section-end lg:flex-row lg:gap-20">
                <div className="flex flex-col gap-6 lg:w-[26.25rem] lg:shrink-0 lg:gap-5">
                    <Eyebrow glyphs={GLYPHS.profile}>{m.about_profile_eyebrow()}</Eyebrow>
                    <h2 id="about-profile-title" className={cn(PROFILE_TITLE_CLASS, 'text-ink')}>
                        {m.about_profile_title()}
                    </h2>
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-6 lg:gap-7">
                    <p className={cn(INTRO_CLASS, 'text-ink')}>{keepHyphenatedWords(m.about_who_heading())}</p>
                    <div className="grid gap-[22px] border-t-[1.5px] border-ink pt-[22px] md:grid-cols-3 md:gap-10 lg:pt-7">
                        {BIO.map((paragraph) => (
                            <div key={paragraph.index} className="flex flex-col gap-2 lg:gap-3">
                                <span aria-hidden="true" className="font-mono text-label text-tan">
                                    {paragraph.index}
                                </span>
                                <p className="text-body text-ink-soft lg:leading-[1.6]">{paragraph.text()}</p>
                            </div>
                        ))}
                    </div>
                    <ArrowLink to="/services">{m.about_services_link()}</ArrowLink>
                </div>
            </div>
        </section>
    )
}

function ApproachSection() {
    return (
        <section aria-labelledby="about-approach-title" className="bg-grain-dark">
            <div className="container-page flex flex-col gap-[clamp(1.75rem,3.4286vw+0.9143rem,4rem)] pt-section pb-section-end">
                <div className="flex flex-col gap-[18px] lg:flex-row lg:items-end lg:justify-between lg:gap-10">
                    <div className="flex flex-col gap-[18px] lg:gap-5">
                        <Eyebrow tone="on-dark" glyphs={GLYPHS.approach}>
                            {m.about_approach_eyebrow()}
                        </Eyebrow>
                        <h2 id="about-approach-title" className="font-display text-section-title text-paper">
                            {m.about_approach_title()}
                        </h2>
                    </div>
                    <p className="text-page-lead text-on-dark lg:w-[26.25rem] lg:shrink-0">{m.about_philosophy_subtitle()}</p>
                </div>

                <ul className="grid gap-7 lg:grid-cols-3 lg:gap-6">
                    {PRINCIPLES.map((principle) => (
                        <li
                            key={principle.code}
                            className={cn(
                                'flex flex-col gap-4 border-[1.5px] border-line-dark px-5 pt-[22px] pb-6 lg:min-h-[300px] lg:gap-6 lg:px-7 lg:pt-7 lg:pb-9',
                                principle.corners,
                            )}
                        >
                            <div className="flex items-center justify-between gap-4">
                                <span aria-hidden="true" className="font-mono text-label text-paper">
                                    {principle.code}
                                </span>
                                <GlyphWord glyphs={principle.glyphs} className={cn(GLYPH_SIZE_CLASS, 'text-on-dark-label')} />
                            </div>
                            <h3 className="text-title text-paper">{principle.title()}</h3>
                            <p className="text-body text-on-dark">{principle.description()}</p>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    )
}

function StackSection() {
    return (
        <section aria-labelledby="about-stack-title" className="bg-grain">
            <div className="container-page flex flex-col gap-6 pt-section pb-section-end lg:gap-14">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
                    <div className="flex flex-col gap-6 lg:gap-5">
                        <Eyebrow glyphs={GLYPHS.stack}>{m.about_stack_eyebrow()}</Eyebrow>
                        <h2 id="about-stack-title" className="font-display text-section-title text-ink">
                            {m.about_stack_title()}
                        </h2>
                    </div>
                    <p className="text-page-lead text-ink lg:w-[26.25rem] lg:shrink-0">{m.about_tech_subtitle()}</p>
                </div>

                <ul className="grid grid-cols-2 border-t-[1.5px] border-l-[1.5px] border-ink md:grid-cols-3">
                    {TECH_ITEMS.map((tech) => (
                        <li key={tech.name} className="flex min-w-0">
                            <TechCell
                                index={tech.index}
                                name={tech.name}
                                className="min-w-0 flex-1 border-r-[1.5px] border-b-[1.5px] px-3.5 min-[360px]:px-4"
                            />
                        </li>
                    ))}
                    {STACK_FILLERS.map((glyphs) => (
                        <li
                            key={glyphs.join('-')}
                            aria-hidden="true"
                            className="hidden items-center justify-center border-r-[1.5px] border-b-[1.5px] border-ink md:flex"
                        >
                            <GlyphWord glyphs={glyphs} className="gap-[0.35em] text-[1.25rem] text-tan" />
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    )
}

export function AboutPage() {
    return (
        <>
            <HeroSection />
            <ProfileSection />
            <ApproachSection />
            <StackSection />
            <LetsTalkSection />
        </>
    )
}
