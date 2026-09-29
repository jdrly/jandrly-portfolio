import type { GlyphId } from '@/components/ui/GlyphWord'
import { ProtectedEmail } from '@/components/ProtectedEmail'
import { ButtonLink } from '@/components/ui/Button'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { StandardItem } from '@/components/ui/StandardItem'
import * as m from '@/paraglide/messages'

/** Glyph sequence drawn next to the "[04] Kontakt" eyebrow. */
const CONTACT_GLYPHS: ReadonlyArray<GlyphId> = [11, 8, 6, 1, 0]

const STANDARDS = [
    { code: 'S.01', title: m.cta_proof_1_title, description: m.cta_proof_1_desc },
    { code: 'S.02', title: m.cta_proof_2_title, description: m.cta_proof_2_desc },
    { code: 'S.03', title: m.cta_proof_3_title, description: m.cta_proof_3_desc },
] as const

/**
 * Contact CTA — shared closing section of Home, About and Services (identical in every design frame).
 * Desktop (≥ lg): title left, body + CTA + e-mail right, standards in three columns below.
 * Mobile: everything stacked.
 */
export function LetsTalkSection() {
    return (
        <section id="contact" aria-labelledby="cta-heading" className="bg-grain">
            <div className="container-page flex flex-col gap-[clamp(3rem,3.8095vw+2.0714rem,5.5rem)] pt-section-end pb-[clamp(4rem,3.0476vw+3.2571rem,6rem)]">
                <div className="flex flex-col gap-[22px] lg:flex-row lg:items-end lg:gap-12 xl:gap-20">
                    <div className="flex min-w-0 flex-1 flex-col gap-[22px] lg:gap-6">
                        <Eyebrow tone="teal" glyphs={CONTACT_GLYPHS}>
                            {m.cta_eyebrow()}
                        </Eyebrow>
                        <h2
                            id="cta-heading"
                            data-reveal="words"
                            className="font-display text-[clamp(2.625rem,3.2381vw+1.8357rem,4.75rem)] leading-none font-black tracking-[-0.034em] text-ink lg:leading-[0.98] lg:tracking-[-0.033em]"
                        >
                            {m.cta_title()}
                        </h2>
                    </div>

                    <div className="flex flex-col gap-[22px] lg:w-[22rem] lg:shrink-0 lg:gap-7 xl:w-[26.25rem]">
                        <p data-reveal="fade-up" className="text-lead text-ink">
                            {m.cta_body()}
                        </p>
                        <ButtonLink variant="primary" to="/contact" data-reveal="fade-up" className="w-full">
                            {m.cta_button()}
                        </ButtonLink>
                        <div
                            data-reveal="fade-up"
                            className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b-[1.5px] border-ink pb-2.5"
                        >
                            <ProtectedEmail className="font-display text-[clamp(1.375rem,0.1905vw+1.3286rem,1.5rem)] leading-[1.2] font-bold text-ink underline decoration-transparent decoration-[1.5px] underline-offset-4 transition-colors duration-200 hover:decoration-current" />
                            <p className="flex items-center gap-1.5 font-mono text-[0.75rem] leading-[1.3] tracking-[0.0375rem] text-ink-soft uppercase lg:gap-2 lg:tracking-[0.0625rem]">
                                <span aria-hidden="true" data-reveal="pulse" className="size-2 shrink-0 rounded-full bg-success" />
                                {m.cta_status()}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-6 lg:gap-7">
                    <div className="flex items-center gap-3 lg:gap-4">
                        <p className="shrink-0 font-mono text-label text-ink uppercase">{m.cta_proof_label()}</p>
                        <span aria-hidden="true" data-reveal="rule" className="h-[1.5px] flex-1 bg-ink" />
                    </div>
                    <ul data-reveal="stagger" className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8 xl:gap-12">
                        {STANDARDS.map((item) => (
                            <li key={item.code}>
                                <StandardItem code={item.code} title={item.title()} description={item.description()} />
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    )
}
