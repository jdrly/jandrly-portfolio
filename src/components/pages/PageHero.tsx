import type { ReactNode } from 'react'
import { FadeIn } from '@/components/motion'

interface PageHeroProps {
    label: string
    titleId?: string
    subtitle?: string
    metaText?: string
    children: ReactNode
}

export function PageHero({ label, titleId, subtitle, metaText, children }: PageHeroProps) {
    return (
        <section
            aria-labelledby={titleId}
            className="relative flex min-h-[50vh] flex-col items-center justify-center overflow-hidden px-4 pb-16 pt-24 sm:px-6 sm:pb-20 sm:pt-32"
        >
            <div className="absolute inset-0 z-0 bg-bg" aria-hidden="true">
                <div className="absolute left-0 top-0 h-full w-full bg-[radial-gradient(circle_at_50%_0%,rgba(255,107,80,0.08),transparent_70%)]" />
            </div>

            <div className="z-10 mx-auto max-w-4xl text-center">
                <FadeIn delay={0}>
                    <div className="mb-8 flex items-center justify-center gap-3">
                        <span className="h-px w-12 bg-border" aria-hidden="true" />
                        <span className="text-sm font-medium uppercase tracking-widest text-text-muted">{label}</span>
                        <span className="h-px w-12 bg-border" aria-hidden="true" />
                    </div>
                </FadeIn>

                <FadeIn delay={0.1}>
                    <h1 id={titleId} className="mb-8 text-balance text-4xl font-bold leading-[0.95] tracking-tight sm:text-6xl md:text-8xl">
                        {children}
                    </h1>
                </FadeIn>

                {subtitle ? (
                    <FadeIn delay={0.2}>
                        <p className="mx-auto max-w-2xl text-balance text-lg leading-relaxed text-text-muted sm:text-xl md:text-2xl">
                            {subtitle}
                        </p>
                    </FadeIn>
                ) : null}

                {metaText ? (
                    <FadeIn delay={subtitle ? 0.3 : 0.2}>
                        <p className="mt-6 text-sm uppercase tracking-wider text-text-muted">{metaText}</p>
                    </FadeIn>
                ) : null}
            </div>
        </section>
    )
}
