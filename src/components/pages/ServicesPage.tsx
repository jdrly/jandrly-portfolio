import type { GlyphId } from '@/components/ui/GlyphWord'
import { LetsTalkSection } from '@/components/sections/LetsTalkSection'
import { ArrowLink } from '@/components/ui/ArrowLink'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { ProcessStep } from '@/components/ui/ProcessStep'
import { ServiceRow } from '@/components/ui/ServiceRow'
import { StarOrnament } from '@/components/ui/StarOrnament'
import { cn } from '@/lib/utils'
import * as m from '@/paraglide/messages'

const GLYPHS = {
    areas: [10, 11, 2, 3],
    process: [0, 12, 1, 2],
} as const satisfies Record<string, ReadonlyArray<GlyphId>>

const AREAS: ReadonlyArray<{
    code: string
    glyphs: ReadonlyArray<GlyphId>
    title: () => string
    description: () => string
}> = [
    { code: 'WEB.APP', glyphs: [10, 11, 2], title: m.services_area_webapp_title, description: m.services_area_webapp_desc },
    { code: 'SYS.API', glyphs: [12, 6, 13, 3], title: m.services_area_backend_title, description: m.services_area_backend_desc },
    { code: 'AUTO.OPS', glyphs: [5, 4, 0], title: m.services_area_automation_title, description: m.services_area_automation_desc },
    { code: 'WEB.CMS', glyphs: [7, 9, 8], title: m.services_area_web_title, description: m.services_area_web_desc },
    { code: 'APP.OS', glyphs: [2, 1, 4], title: m.services_area_apps_title, description: m.services_area_apps_desc },
    { code: 'TECH.AUDIT', glyphs: [13, 0, 3, 12], title: m.services_area_consulting_title, description: m.services_area_consulting_desc },
]

const STEPS = [
    { number: '01', title: m.process_step_1_title, description: m.process_step_1_desc },
    { number: '02', title: m.process_step_2_title, description: m.process_step_2_desc },
    { number: '03', title: m.process_step_3_title, description: m.process_step_3_desc },
    { number: '04', title: m.process_step_4_title, description: m.process_step_4_desc },
] as const

const SPEC_KEYWORD_WIDTH = 8

/** Mono "query" block under the hero: SQL lines (decorative) and the result summary. */
function HeroSpec({ className }: { className?: string }) {
    const lines = [
        ['SELECT', '*'],
        ['FROM', m.services_spec_table()],
        ['WHERE', m.services_spec_condition()],
    ] as const

    return (
        <div className={cn('flex flex-col gap-1.5 border-ink font-mono lg:gap-2.5', className)}>
            <div aria-hidden="true" className="flex flex-col gap-1.5 text-code leading-[1.3] whitespace-pre text-ink lg:gap-2.5">
                {lines.map(([keyword, value]) => (
                    <span key={keyword} data-reveal="type">
                        {keyword.padEnd(SPEC_KEYWORD_WIDTH)}
                        {value}
                    </span>
                ))}
            </div>
            <p data-reveal="fade-up" className="text-label text-tan uppercase">
                <span aria-hidden="true">→ </span>
                {m.services_spec_result()}
            </p>
        </div>
    )
}

function HeroSection() {
    return (
        <section aria-labelledby="services-title" className="bg-grain">
            <div className="container-page flex flex-col gap-[22px] pt-7 pb-12 lg:flex-row lg:items-end lg:gap-20 lg:pt-[88px] lg:pb-section">
                <div className="flex min-w-0 flex-1 flex-col gap-[22px] lg:gap-7">
                    <div className="flex items-center justify-between gap-4">
                        <Eyebrow>{m.services_hero_eyebrow()}</Eyebrow>
                        <StarOrnament variant="compact" className="lg:hidden" />
                    </div>
                    <h1 id="services-title" data-reveal="words" className="text-h1 text-ink xl:text-wrap">
                        {m.services_hero_title()}
                    </h1>
                    <p data-reveal="fade-up" className="text-page-lead max-w-[36.25rem] text-ink-soft">
                        {m.services_subtitle()}
                    </p>
                    <HeroSpec className="border-y-[1.5px] py-3.5 lg:hidden" />
                </div>
                <div className="hidden w-[min(25rem,34%)] shrink-0 flex-col items-end gap-8 lg:flex">
                    <StarOrnament variant="inner-ring" />
                    <HeroSpec className="w-full border-t-[1.5px] pt-4" />
                </div>
            </div>
        </section>
    )
}

function AreasSection() {
    return (
        <section aria-labelledby="services-areas-title" className="bg-grain">
            <div className="container-page flex flex-col gap-7 pt-4 pb-section-end lg:gap-14 lg:pt-10">
                <div className="flex flex-col gap-7 lg:gap-5">
                    <Eyebrow glyphs={GLYPHS.areas}>{m.services_areas_eyebrow()}</Eyebrow>
                    <h2 id="services-areas-title" data-reveal="words" className="max-w-[47.5rem] text-h2 text-ink">
                        {m.services_areas_title()}
                    </h2>
                </div>
                <ul className="border-b-[1.5px] border-ink">
                    {AREAS.map((area, index) => (
                        <li key={area.code}>
                            <ServiceRow
                                index={String(index + 1).padStart(2, '0')}
                                title={area.title()}
                                description={area.description()}
                                code={area.code}
                                glyphs={area.glyphs}
                                tagWidth="lg"
                                descriptionTone="soft"
                                titleClassName="xl:text-wrap"
                            />
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    )
}

function ProcessSection() {
    return (
        <section aria-labelledby="services-process-title" className="bg-grain-dark">
            <div className="container-page flex flex-col gap-7 pt-section pb-section-end lg:gap-[clamp(1.75rem,4.1905vw+0.7286rem,4.5rem)]">
                <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
                    <div className="flex flex-col gap-7 lg:gap-5">
                        <Eyebrow tone="on-dark" glyphs={GLYPHS.process}>
                            {m.services_process_eyebrow()}
                        </Eyebrow>
                        <h2
                            id="services-process-title"
                            data-reveal="words"
                            data-scroll="drift"
                            className="font-display text-section-title text-paper"
                        >
                            {m.services_process_title()}
                        </h2>
                    </div>
                    <p data-reveal="fade-up" className="text-page-lead text-on-dark lg:w-[26.25rem] lg:shrink-0">
                        {m.process_subtitle()}
                    </p>
                </div>

                {/* With the scroll, each step's rule fills in turn and the step lights up (ProcessStep). Without JavaScript,
                    or with reduced motion, the static rules show. */}
                <ol data-scroll-root="" data-scroll="steps" data-reveal="stagger" className="flex flex-col lg:grid lg:grid-cols-4 lg:gap-8">
                    {STEPS.map((step, index) => (
                        <ProcessStep
                            key={step.number}
                            as="li"
                            number={step.number}
                            title={step.title()}
                            description={step.description()}
                            className={index < STEPS.length - 1 ? 'pb-7 lg:pb-0' : undefined}
                        />
                    ))}
                </ol>

                <ArrowLink to="/about" tone="on-dark" reveal>
                    {m.services_about_link()}
                </ArrowLink>
            </div>
        </section>
    )
}

export function ServicesPage() {
    return (
        <>
            <HeroSection />
            <AreasSection />
            <ProcessSection />
            <LetsTalkSection />
        </>
    )
}
