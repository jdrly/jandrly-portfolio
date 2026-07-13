import { Link } from '@tanstack/react-router'
import { m as motion } from 'framer-motion'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { FadeIn, SlideIn, smoothEase } from '@/components/motion'
import * as m from '@/paraglide/messages'
import { localizeHref } from '@/paraglide/runtime'

function useProofItems() {
    return [
        {
            title: m.cta_proof_1_title(),
            description: m.cta_proof_1_desc(),
        },
        {
            title: m.cta_proof_2_title(),
            description: m.cta_proof_2_desc(),
        },
        {
            title: m.cta_proof_3_title(),
            description: m.cta_proof_3_desc(),
        },
    ]
}

function CollaborationStandard() {
    const proofItems = useProofItems()

    return (
        <div className="relative">
            <motion.div
                className="group relative overflow-hidden rounded-3xl border border-border-subtle bg-[#0d0d0d] shadow-2xl shadow-black/50"
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3, ease: smoothEase }}
            >
                <div
                    className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,107,80,0.09),transparent_55%)]"
                    aria-hidden="true"
                />

                <div className="relative border-b border-border-subtle px-6 py-5 sm:px-8">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{m.cta_proof_label()}</p>
                </div>

                <ul className="relative divide-y divide-border-subtle px-6 sm:px-8">
                    {proofItems.map((item) => (
                        <li key={item.title} className="flex gap-4 py-7 sm:gap-5 sm:py-8">
                            <CheckCircle2 className="mt-0.5 shrink-0 text-accent" size={22} aria-hidden="true" />
                            <div>
                                <h3 className="mb-2 text-lg font-bold text-white sm:text-xl">{item.title}</h3>
                                <p className="max-w-md text-sm leading-relaxed text-text-muted sm:text-base">{item.description}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </motion.div>

            <div className="absolute -bottom-5 -left-5 -z-10 h-28 w-28 rounded-full bg-accent/10 blur-3xl" aria-hidden="true" />
        </div>
    )
}

export function LetsTalkSection() {
    return (
        <section
            id="contact"
            aria-labelledby="cta-heading"
            className="relative overflow-hidden border-t border-border-subtle bg-bg px-4 py-16 sm:px-6 sm:py-24 lg:py-32"
        >
            <div className="absolute inset-0 z-0 bg-bg" aria-hidden="true">
                <div className="pointer-events-none absolute right-0 top-0 h-150 w-150 rounded-full bg-accent/5 blur-[120px]" />
                <div className="pointer-events-none absolute bottom-0 left-0 h-100 w-100 rounded-full bg-blue-500/5 blur-[100px]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[64px_64px] mask-[radial-gradient(ellipse_at_center,black_50%,transparent_100%)]" />
            </div>

            <div className="relative z-10 mx-auto max-w-7xl">
                <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
                    <div>
                        <FadeIn delay={0}>
                            <div className="mb-8 flex items-center gap-3">
                                <span className="h-px w-12 bg-accent" aria-hidden="true" />
                                <span className="text-sm font-medium uppercase tracking-widest text-accent">{m.cta_label()}</span>
                            </div>
                        </FadeIn>

                        <FadeIn delay={0.1}>
                            <h2
                                id="cta-heading"
                                className="mb-6 text-balance text-4xl font-bold leading-[0.95] tracking-tight text-white sm:mb-8 sm:text-6xl"
                            >
                                {m.cta_heading_1()} <span className="text-accent">{m.cta_heading_2()}</span>
                            </h2>
                        </FadeIn>

                        <FadeIn delay={0.2}>
                            <p className="mb-8 max-w-lg text-base leading-relaxed text-text-muted sm:mb-12 sm:text-xl">
                                {m.cta_subtitle()}
                            </p>
                        </FadeIn>

                        <FadeIn delay={0.3}>
                            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    transition={{ duration: 0.2, ease: smoothEase }}
                                >
                                    <Link
                                        to={localizeHref('/contact')}
                                        className="group inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-accent px-8 py-4 text-sm font-bold uppercase tracking-wide text-black transition-colors hover:bg-accent-hover"
                                    >
                                        <span>{m.cta_button()}</span>
                                        <ArrowRight
                                            size={20}
                                            className="transition-transform group-hover:translate-x-1"
                                            aria-hidden="true"
                                        />
                                    </Link>
                                </motion.div>

                                <motion.a
                                    href="mailto:jd@jandrly.cz"
                                    className="inline-flex items-center gap-2 px-2 py-3 text-text-muted transition-colors hover:text-white"
                                    whileHover={{ x: 4 }}
                                    transition={{ duration: 0.2, ease: smoothEase }}
                                >
                                    <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
                                    jd@jandrly.cz
                                </motion.a>
                            </div>
                        </FadeIn>
                    </div>

                    <SlideIn direction="right" delay={0.2}>
                        <CollaborationStandard />
                    </SlideIn>
                </div>
            </div>
        </section>
    )
}
