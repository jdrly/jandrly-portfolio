import { m as motion } from 'framer-motion'
import { AppWindow, Cable, Globe } from 'lucide-react'
import type { ComponentType } from 'react'
import { FadeIn, StaggerContainer, StaggerItem, smoothEase } from '@/components/motion'
import * as m from '@/paraglide/messages'

interface BuildExample {
    icon: ComponentType<{ size?: number }>
    title: string
    description: string
    result: string
}

function useBuildExamples(): Array<BuildExample> {
    return [
        {
            icon: AppWindow,
            title: m.work_example_webapp_title(),
            description: m.work_example_webapp_desc(),
            result: m.work_example_webapp_result(),
        },
        {
            icon: Cable,
            title: m.work_example_integrations_title(),
            description: m.work_example_integrations_desc(),
            result: m.work_example_integrations_result(),
        },
        {
            icon: Globe,
            title: m.work_example_automation_title(),
            description: m.work_example_automation_desc(),
            result: m.work_example_automation_result(),
        },
    ]
}

export function BuildExamplesSection() {
    const examples = useBuildExamples()

    return (
        <section id="work" aria-labelledby="work-heading" className="scroll-mt-24 px-4 py-16 sm:px-6 sm:py-24 md:px-12">
            <div className="mx-auto max-w-7xl">
                <FadeIn>
                    <div className="mb-12 flex flex-col gap-6 sm:mb-16 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-accent">{m.work_label()}</p>
                            <h2 id="work-heading" className="mb-5 text-3xl font-bold tracking-tight text-white sm:text-5xl">
                                {m.work_heading()}
                            </h2>
                            <p className="max-w-2xl text-base leading-relaxed text-text-muted sm:text-lg">{m.work_subtitle()}</p>
                        </div>
                        <p className="max-w-sm border-l border-border pl-4 text-sm leading-relaxed text-text-subtle">
                            <span className="font-semibold text-text-muted">{m.work_clients_label()}:</span> {m.work_clients_desc()}
                        </p>
                    </div>
                </FadeIn>

                <StaggerContainer staggerDelay={0.08} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {examples.map((example) => {
                        const Icon = example.icon

                        return (
                            <StaggerItem key={example.title} className="h-full">
                                <motion.article
                                    className="group flex h-full flex-col rounded-3xl border border-border-subtle bg-bg-card p-7 transition-colors duration-500 hover:border-accent/60 sm:p-9"
                                    whileHover={{ y: -4 }}
                                    transition={{ duration: 0.25, ease: smoothEase }}
                                >
                                    <div className="mb-10 flex items-start">
                                        <div
                                            className="text-text-subtle transition-colors duration-300 group-hover:text-accent"
                                            aria-hidden="true"
                                        >
                                            <Icon size={30} />
                                        </div>
                                    </div>
                                    <h3 className="mb-3 text-xl font-bold leading-tight text-white transition-transform duration-300 group-hover:translate-x-2 sm:text-2xl">
                                        {example.title}
                                    </h3>
                                    <p className="mb-8 max-w-sm text-sm leading-relaxed text-text-muted sm:text-base">
                                        {example.description}
                                    </p>
                                    <p className="mt-auto border-t border-border-subtle pt-5 text-sm font-medium leading-relaxed text-white">
                                        {example.result}
                                    </p>
                                </motion.article>
                            </StaggerItem>
                        )
                    })}
                </StaggerContainer>
            </div>
        </section>
    )
}
