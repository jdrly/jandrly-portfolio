import { ButtonLink } from '@/components/ui/Button'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { StarOrnament } from '@/components/ui/StarOrnament'
import * as m from '@/paraglide/messages'

/** 404 — no design frame; built from the page-hero language (mono index, eyebrow, display title, lead, CTA). */
export function RootNotFound() {
    return (
        <section aria-labelledby="notfound-title" className="bg-grain">
            <div className="container-page flex min-h-[70vh] flex-col justify-center gap-5 py-section lg:gap-7">
                <div className="flex items-end justify-between gap-6">
                    <p
                        aria-hidden="true"
                        className="font-mono text-[clamp(4.5rem,7.619vw+2.643rem,9.5rem)] leading-none font-medium tracking-[-0.04em] text-teal-ink"
                    >
                        404
                    </p>
                    <StarOrnament className="hidden size-[clamp(6rem,4.5vw+2.5rem,9.375rem)] md:block" />
                </div>
                <div className="flex flex-col gap-5 border-t-[1.5px] border-ink pt-5 lg:gap-7 lg:pt-7">
                    <Eyebrow tone="teal">{m.notfound_eyebrow()}</Eyebrow>
                    <h1 id="notfound-title" className="max-w-[56.25rem] font-display text-h1 text-ink">
                        {m.notfound_title()}
                    </h1>
                    <p className="max-w-160 text-lead text-ink-soft">{m.notfound_text()}</p>
                    <ButtonLink to="/" className="mt-2">
                        {m.notfound_button()}
                    </ButtonLink>
                </div>
            </div>
        </section>
    )
}
