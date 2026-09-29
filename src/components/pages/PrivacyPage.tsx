import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { GlyphId } from '@/components/ui/GlyphWord'
import { ProtectedEmail } from '@/components/ProtectedEmail'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { keepHyphenatedWords } from '@/lib/typography'
import { cn } from '@/lib/utils'
import * as m from '@/paraglide/messages'

const HERO_GLYPHS: ReadonlyArray<GlyphId> = [13, 9, 7, 11]

const PARAGRAPH_CLASS = 'text-body text-ink-soft lg:leading-[1.65]'

interface PrivacySection {
    id: string
    index: string
    heading: () => string
    body: () => ReactNode
}

const SECTIONS: ReadonlyArray<PrivacySection> = [
    {
        id: 'data',
        index: '01',
        heading: m.privacy_section_1_heading,
        body: () => (
            <>
                <p className={PARAGRAPH_CLASS}>{keepHyphenatedWords(m.privacy_section_1_text())}</p>
                <ul className="flex flex-col gap-3 lg:pt-1">
                    {[m.privacy_section_1_item_1(), m.privacy_section_1_item_2(), m.privacy_section_1_item_3()].map((item) => (
                        <li key={item} className="flex gap-3 lg:gap-3.5">
                            <span aria-hidden="true" className="mt-[9px] size-[7px] shrink-0 bg-teal lg:mt-2.5 lg:size-2" />
                            <span className={PARAGRAPH_CLASS}>{keepHyphenatedWords(item)}</span>
                        </li>
                    ))}
                </ul>
            </>
        ),
    },
    {
        id: 'purpose',
        index: '02',
        heading: m.privacy_section_2_heading,
        body: () => <p className={PARAGRAPH_CLASS}>{keepHyphenatedWords(m.privacy_section_2_text())}</p>,
    },
    {
        id: 'processors',
        index: '03',
        heading: m.privacy_section_3_heading,
        body: () => <p className={PARAGRAPH_CLASS}>{keepHyphenatedWords(m.privacy_section_3_text())}</p>,
    },
    {
        id: 'retention',
        index: '04',
        heading: m.privacy_section_4_heading,
        body: () => <p className={PARAGRAPH_CLASS}>{keepHyphenatedWords(m.privacy_section_4_text())}</p>,
    },
    {
        id: 'rights',
        index: '05',
        heading: m.privacy_section_5_heading,
        body: () => (
            <>
                <p className={PARAGRAPH_CLASS}>
                    {keepHyphenatedWords(m.privacy_section_5_text())}{' '}
                    <ProtectedEmail className="font-semibold text-ink underline decoration-[1.5px] underline-offset-4 transition-colors hover:text-teal-ink" />
                    .
                </p>
                <p className={PARAGRAPH_CLASS}>{keepHyphenatedWords(m.privacy_section_5_controller())}</p>
            </>
        ),
    },
]

const SECTION_IDS = SECTIONS.map((section) => section.id)

/** Soukromí — hero with title + meta row, then a sticky table of contents beside the numbered document. */
export function PrivacyPage() {
    return (
        <>
            <PrivacyHero />
            <div className="bg-grain">
                <div className="container-page flex flex-col gap-10 pb-16 lg:flex-row lg:gap-12 xl:gap-24 lg:pt-6 lg:pb-30">
                    <TableOfContents />
                    <article className="flex min-w-0 flex-1 flex-col gap-10 lg:gap-14">
                        {SECTIONS.map((section) => (
                            <section
                                key={section.id}
                                id={section.id}
                                aria-labelledby={`${section.id}-heading`}
                                className="flex scroll-mt-8 flex-col gap-3.5 lg:gap-[18px]"
                            >
                                <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:gap-5">
                                    <span
                                        aria-hidden="true"
                                        className="font-mono text-[clamp(0.875rem,0.1905vw+0.8286rem,1rem)] leading-[1.3] font-bold text-tan"
                                    >
                                        § {section.index}
                                    </span>
                                    <h2 id={`${section.id}-heading`} className="font-display text-h4 text-ink">
                                        {section.heading()}
                                    </h2>
                                </div>
                                {section.body()}
                            </section>
                        ))}
                    </article>
                </div>
            </div>
        </>
    )
}

function PrivacyHero() {
    return (
        <section aria-labelledby="privacy-title" className="bg-grain">
            <div className="container-page flex flex-col gap-5 pt-[clamp(1.75rem,5.7143vw+0.3571rem,5.5rem)] pb-8 lg:gap-7 lg:pb-18">
                <Eyebrow tone="teal" glyphs={HERO_GLYPHS}>
                    {m.privacy_label()}
                </Eyebrow>
                <h1
                    id="privacy-title"
                    className="max-w-[56.25rem] font-display text-[clamp(2.5rem,4.1905vw+1.4786rem,5.25rem)] leading-[0.97] font-black tracking-[-0.036em] text-ink"
                >
                    {m.privacy_title()}
                </h1>
                <div className="flex flex-col-reverse items-start gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-10 lg:border-t-[1.5px] lg:border-ink lg:pt-5">
                    <p className="max-w-160 text-lead text-ink">{keepHyphenatedWords(m.privacy_intro())}</p>
                    <p className="flex shrink-0 items-center gap-2 rounded-tl-lg rounded-br-lg border-[1.5px] border-ink px-3 py-2 font-mono text-label font-semibold tracking-[0.0375rem] text-ink uppercase lg:gap-2.5 lg:rounded-tl-[10px] lg:rounded-br-[10px] lg:px-4 lg:py-2.5 lg:tracking-[0.0625rem]">
                        <span aria-hidden="true" className="size-[7px] rounded-full bg-teal lg:size-2" />
                        {m.privacy_last_updated()}
                    </p>
                </div>
            </div>
        </section>
    )
}

/** Tracks which section is currently being read so the (sticky, desktop) table of contents can highlight it. */
function useActiveSection(ids: ReadonlyArray<string>) {
    const [activeId, setActiveId] = useState(ids[0])

    useEffect(() => {
        const elements = ids.map((id) => document.getElementById(id)).filter((element) => element !== null)
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
                if (visible.length > 0) {
                    setActiveId(visible[0].target.id)
                }
            },
            { rootMargin: '0px 0px -65% 0px' },
        )
        elements.forEach((element) => observer.observe(element))

        return () => observer.disconnect()
    }, [ids])

    return activeId
}

function TableOfContents() {
    const activeId = useActiveSection(SECTION_IDS)

    return (
        <nav
            aria-labelledby="privacy-toc-label"
            className="flex shrink-0 flex-col gap-3 lg:sticky lg:top-8 lg:w-[21.25rem] lg:gap-4 lg:self-start"
        >
            <p id="privacy-toc-label" className="font-mono text-label text-ink uppercase">
                {m.privacy_toc_label()}
            </p>
            <ol className="border-b-[1.5px] border-ink">
                {SECTIONS.map((section) => {
                    const isActive = section.id === activeId

                    return (
                        <li key={section.id} className="border-t-[1.5px] border-ink">
                            <a
                                href={`#${section.id}`}
                                aria-current={isActive ? 'location' : undefined}
                                className="group flex items-center gap-3 py-3 lg:gap-3.5 lg:py-3.5"
                            >
                                <span aria-hidden="true" className="font-mono text-label text-tan">
                                    {section.index}
                                </span>
                                <span
                                    className={cn(
                                        'text-body-sm leading-[1.1] font-medium text-ink underline decoration-transparent decoration-[1.5px] underline-offset-4 transition-colors group-hover:decoration-current',
                                        isActive ? 'lg:font-bold' : null,
                                    )}
                                >
                                    {section.heading()}
                                </span>
                            </a>
                        </li>
                    )
                })}
            </ol>
        </nav>
    )
}
