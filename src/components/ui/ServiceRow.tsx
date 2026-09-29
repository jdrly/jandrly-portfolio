import type { GlyphId } from '@/components/ui/GlyphWord'
import { CodeTag } from '@/components/ui/CodeTag'
import { GlyphWord } from '@/components/ui/GlyphWord'
import { GLYPH_WORDS } from '@/components/ui/glyphWords'
import { cn } from '@/lib/utils'

type ServiceRowTagWidth = 'md' | 'lg'
type ServiceRowDescriptionTone = 'ink' | 'soft'

/** Desktop grid (index · title · description · tag) and the matching code tag width. */
const TAG_WIDTH_CLASS: Record<ServiceRowTagWidth, { grid: string; tag: string }> = {
    // 112px tag column — fits codes up to "AUTO.OPS".
    md: { grid: 'lg:grid-cols-[6rem_minmax(0,500fr)_minmax(0,452fr)_7rem]', tag: 'lg:w-28' },
    // 128px tag column — fits longer codes such as "TECH.AUDIT".
    lg: { grid: 'lg:grid-cols-[6rem_minmax(0,500fr)_minmax(0,436fr)_8rem]', tag: 'lg:w-32' },
}

const DESCRIPTION_TONE_CLASS: Record<ServiceRowDescriptionTone, string> = {
    // Soft ink on mobile, full ink from `lg` (component default).
    ink: 'text-ink-soft lg:text-ink',
    soft: 'text-ink-soft',
}

interface ServiceRowProps {
    /** Two-digit index, e.g. "01". */
    index: string
    title: string
    description: string
    /** Code tag text, e.g. "WEB.APP". */
    code: string
    glyphs?: ReadonlyArray<GlyphId>
    headingLevel?: 'h2' | 'h3' | 'h4'
    /** Width of the desktop code tag column: `md` 112px (default), `lg` 128px. */
    tagWidth?: ServiceRowTagWidth
    /** Description color on desktop: `ink` (default) or `soft` (ink-soft at every size). */
    descriptionTone?: ServiceRowDescriptionTone
    /** Extra title classes, e.g. `xl:text-wrap` to opt out of balanced wrapping. */
    titleClassName?: string
    className?: string
}

/**
 * Service Row — desktop: index · title + glyphs · description · code tag in one ruled row;
 * mobile (< lg): index + tag on top, then title, glyphs and description stacked.
 * Motion: the top rule draws in, then the parts rise (`data-reveal="row"`); hovering scrambles the code tag and
 * decodes the glyphs.
 */
export function ServiceRow({
    index,
    title,
    description,
    code,
    glyphs = GLYPH_WORDS.service,
    headingLevel: Heading = 'h3',
    tagWidth = 'md',
    descriptionTone = 'ink',
    titleClassName,
    className,
}: ServiceRowProps) {
    const widths = TAG_WIDTH_CLASS[tagWidth]

    return (
        <article
            data-reveal="row"
            data-hover-group=""
            className={cn('relative flex flex-col gap-3 py-6 lg:grid lg:gap-10 lg:py-9', widths.grid, className)}
        >
            <span aria-hidden="true" data-reveal-rule="" className="absolute inset-x-0 top-0 h-[1.5px] bg-ink" />
            <div className="flex items-center justify-between lg:contents">
                <span data-reveal-part="" className="font-mono text-index text-tan">
                    {index}
                </span>
                <span data-reveal-part="" className={cn('flex lg:order-last lg:self-start', widths.tag)}>
                    <CodeTag className="lg:w-full">{code}</CodeTag>
                </span>
            </div>
            <div data-reveal-part="" className="flex flex-col gap-3 lg:gap-2.5">
                <Heading className={cn('text-h4 text-ink', titleClassName)}>{title}</Heading>
                <GlyphWord glyphs={glyphs} className="gap-[0.31em] text-[clamp(0.8125rem,0.1905vw+0.7661rem,0.9375rem)] text-tan" />
            </div>
            <p data-reveal-part="" className={cn('text-body-sm lg:text-body', DESCRIPTION_TONE_CLASS[descriptionTone])}>
                {description}
            </p>
        </article>
    )
}
