import type { GlyphId } from '@/components/ui/GlyphWord'
import { Barcode } from '@/components/ui/Barcode'
import { GlyphWord } from '@/components/ui/GlyphWord'
import { BARCODE_PATTERNS } from '@/components/ui/barcodePatterns'
import { GLYPH_WORDS } from '@/components/ui/glyphWords'
import { keepHyphenatedWords } from '@/lib/typography'
import { cn } from '@/lib/utils'
import * as m from '@/paraglide/messages'

interface CaseCardProps {
    /** Mono code, e.g. "CASE.01". */
    code: string
    title: string
    description: string
    /** Outcome text below the "Výstup →" label. */
    output: string
    /** Override the "Výstup" label (defaults to the localized message). */
    outputLabel?: string
    glyphs?: ReadonlyArray<GlyphId>
    /** Decorative barcode bars (hidden on mobile, as in the design). */
    bars?: ReadonlyArray<number>
    headingLevel?: 'h3' | 'h4'
    className?: string
}

/** Case Card — outlined card for ink sections: code + glyphs, barcode, title, description, outcome. */
export function CaseCard({
    code,
    title,
    description,
    output,
    outputLabel = m.case_output_label(),
    glyphs = GLYPH_WORDS.case,
    bars = BARCODE_PATTERNS.case1,
    headingLevel: Heading = 'h3',
    className,
}: CaseCardProps) {
    return (
        <article
            data-hover-group=""
            className={cn(
                'flex flex-col gap-[18px] rounded-tl-[22px] rounded-br-[22px] border-[1.5px] border-line-dark px-5 pt-[22px] pb-6 lg:gap-7 lg:rounded-tl-[28px] lg:rounded-br-[28px] lg:px-7 lg:pt-7 lg:pb-8',
                className,
            )}
        >
            <div className="flex items-center justify-between gap-4">
                <p data-scramble-hover="" className="font-mono text-label text-paper">
                    {code}
                </p>
                <GlyphWord
                    glyphs={glyphs}
                    className="gap-[0.31em] text-[clamp(0.8125rem,0.1905vw+0.7661rem,0.9375rem)] text-on-dark-label"
                />
            </div>
            <Barcode bars={bars} gap={3} height={22} className="hidden text-line-dark-strong md:block" />
            <Heading className="text-title whitespace-pre-line text-paper">{keepHyphenatedWords(title)}</Heading>
            <p className="text-body text-on-dark">{description}</p>
            <div className="mt-auto flex flex-col gap-1.5 border-t-[1.5px] border-line-dark pt-4 lg:gap-2 lg:pt-5">
                <p className="font-mono text-label text-on-dark-label uppercase">
                    {outputLabel} <span aria-hidden="true">→</span>
                </p>
                <p className="text-body leading-[1.4] font-semibold text-paper">{output}</p>
            </div>
        </article>
    )
}
