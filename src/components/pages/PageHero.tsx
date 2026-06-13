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
            className="relative min-h-[50vh] flex flex-col items-center justify-center px-4 pt-24 pb-16 overflow-hidden sm:px-6 sm:pt-32 sm:pb-20"
        >
            <div className="absolute inset-0 z-0 bg-bg" aria-hidden="true">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(255,107,80,0.08),transparent_70%)]" />
            </div>

            <div className="z-10 max-w-4xl mx-auto text-center">
                <FadeIn delay={0}>
                    <div className="flex items-center justify-center gap-3 mb-8">
                        <span className="h-px w-12 bg-border" aria-hidden="true" />
                        <span className="text-sm font-medium text-text-muted uppercase tracking-widest">{label}</span>
                        <span className="h-px w-12 bg-border" aria-hidden="true" />
                    </div>
                </FadeIn>

                <FadeIn delay={0.1}>
                    <h1 id={titleId} className="text-4xl font-bold tracking-tight mb-8 leading-[0.9] sm:text-6xl md:text-8xl">
                        {children}
                    </h1>
                </FadeIn>

                {subtitle ? (
                    <FadeIn delay={0.2}>
                        <p className="text-lg text-text-muted leading-relaxed max-w-2xl mx-auto text-balance sm:text-xl md:text-2xl">
                            {subtitle}
                        </p>
                    </FadeIn>
                ) : null}

                {metaText ? (
                    <FadeIn delay={subtitle ? 0.3 : 0.2}>
                        <p className="mt-6 text-sm tracking-wider text-text-muted uppercase">{metaText}</p>
                    </FadeIn>
                ) : null}
            </div>
        </section>
    )
}
