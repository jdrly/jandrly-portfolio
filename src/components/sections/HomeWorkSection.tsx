import { Fragment } from 'react'
import type { GlyphId } from '@/components/ui/GlyphWord'
import { BARCODE_PATTERNS } from '@/components/ui/barcodePatterns'
import { CaseCard } from '@/components/ui/CaseCard'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { GlyphWord } from '@/components/ui/GlyphWord'
import { cn } from '@/lib/utils'
import * as m from '@/paraglide/messages'

const WORK_GLYPHS: ReadonlyArray<GlyphId> = [2, 13, 11, 10, 12]
const CLIENTS_GLYPHS: ReadonlyArray<GlyphId> = [13, 5, 12, 9, 7]

/** The middle card mirrors the clipped corners (top-right + bottom-left). */
const MIRRORED_CORNERS_CLASS =
    'rounded-tl-none rounded-br-none rounded-tr-[22px] rounded-bl-[22px] lg:rounded-tl-none lg:rounded-br-none lg:rounded-tr-[28px] lg:rounded-bl-[28px]'

interface WorkCase {
    code: string
    glyphs: ReadonlyArray<GlyphId>
    bars: ReadonlyArray<number>
    title: () => string
    description: () => string
    output: () => string
    className?: string
}

const CASES: ReadonlyArray<WorkCase> = [
    {
        code: 'CASE.01',
        glyphs: [3, 0, 4, 6],
        bars: BARCODE_PATTERNS.case1,
        title: m.home_work_case_1_title,
        description: m.work_example_webapp_desc,
        output: m.home_work_case_1_output,
    },
    {
        code: 'CASE.02',
        glyphs: [9, 1, 5],
        bars: BARCODE_PATTERNS.case2,
        title: m.work_example_integrations_title,
        description: m.work_example_integrations_desc,
        output: m.home_work_case_2_output,
        className: MIRRORED_CORNERS_CLASS,
    },
    {
        code: 'CASE.03',
        glyphs: [10, 11, 2],
        bars: BARCODE_PATTERNS.case3,
        title: m.work_example_automation_title,
        description: m.work_example_automation_desc,
        output: m.home_work_case_3_output,
    },
]

/** Client names, grouped as the mobile design breaks them into lines (one justified row from `xl`). */
const CLIENT_GROUPS: ReadonlyArray<ReadonlyArray<string>> = [
    ['Forecom Solutions'],
    ['eSoul', 'Eywo', 'Cymedica'],
    ['Safetica', 'BOS Automotive'],
]

const CLIENT_NAME_CLASS = 'font-display text-[clamp(1.5rem,0.7619vw+1.3143rem,2rem)] leading-[1.2]'

function ClientSeparator({ className }: { className?: string }) {
    return (
        <span aria-hidden="true" className={cn(CLIENT_NAME_CLASS, 'font-normal text-line-dark-strong', className)}>
            /
        </span>
    )
}

function ClientList() {
    return (
        <ul aria-label={m.work_clients_label()} className="flex flex-wrap items-center gap-x-2.5 md:gap-x-4 xl:justify-between">
            {CLIENT_GROUPS.map((group, groupIndex) => (
                <Fragment key={group[0]}>
                    {groupIndex > 0 ? <li aria-hidden="true" className="basis-full xl:hidden" /> : null}
                    {group.map((name, nameIndex) => (
                        <li key={name} className="flex items-center gap-2.5 py-[3px] md:gap-4 md:py-1 xl:contents">
                            {nameIndex > 0 ? <ClientSeparator /> : null}
                            {nameIndex === 0 && groupIndex > 0 ? <ClientSeparator className="hidden xl:inline" /> : null}
                            <span className={cn(CLIENT_NAME_CLASS, 'font-extrabold tracking-[-0.025em] text-paper')}>{name}</span>
                        </li>
                    ))}
                </Fragment>
            ))}
        </ul>
    )
}

/** "[03] Typická zadání" — ink section with three case cards and the selected-clients strip. */
export function HomeWorkSection() {
    return (
        <section id="work" aria-labelledby="home-work-heading" className="bg-grain-dark scroll-mt-4 text-paper">
            <div className="container-page flex flex-col gap-[clamp(2.25rem,3.4286vw+1.4143rem,4.5rem)] pt-[clamp(4rem,3.8095vw+3.0714rem,6.5rem)]">
                <div className="flex flex-col gap-[18px] lg:flex-row lg:items-end lg:justify-between lg:gap-12">
                    <div className="flex flex-col gap-[18px] lg:gap-5">
                        <Eyebrow tone="on-dark" glyphs={WORK_GLYPHS}>
                            {m.home_work_eyebrow()}
                        </Eyebrow>
                        <h2
                            id="home-work-heading"
                            className="font-display text-home-title text-paper lg:leading-[0.95] lg:tracking-[-0.0357em]"
                        >
                            {m.home_work_title()}
                        </h2>
                    </div>
                    <p className="text-body text-on-dark lg:w-[27.5rem] lg:shrink-0">{m.work_subtitle()}</p>
                </div>

                <ul className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
                    {CASES.map((item) => (
                        <li key={item.code} className="flex">
                            <CaseCard
                                code={item.code}
                                glyphs={item.glyphs}
                                bars={item.bars}
                                title={item.title()}
                                description={item.description()}
                                output={item.output()}
                                className={cn('flex-1', item.className)}
                            />
                        </li>
                    ))}
                </ul>

                <div className="flex flex-col gap-4 border-t-[1.5px] border-line-dark pt-7 pb-14 lg:gap-6 lg:pt-10">
                    <p className="flex items-center gap-3 text-on-dark lg:gap-4">
                        <span className="font-mono text-label uppercase">{m.work_clients_label()}</span>
                        <GlyphWord
                            glyphs={CLIENTS_GLYPHS}
                            className="gap-[0.31em] text-[clamp(0.8125rem,0.1905vw+0.7661rem,0.9375rem)] text-on-dark-label"
                        />
                    </p>
                    <ClientList />
                </div>
            </div>
        </section>
    )
}
