import { m as motion } from 'framer-motion'
import { AppWindow, Cable, Globe, Smartphone, Workflow, Wrench } from 'lucide-react'
import type { ComponentType } from 'react'
import { FadeIn, StaggerContainer, StaggerItem, smoothEase } from '@/components/motion'
import * as m from '@/paraglide/messages'

interface BuildExample {
    icon: ComponentType<{ size?: number }>
    title: string
    description: string
}

function useBuildExamples(): Array<BuildExample> {
    return [
        {
            icon: AppWindow,
            title: m.work_example_webapp_title(),
            description: m.work_example_webapp_desc(),
        },
        {
            icon: Cable,
            title: m.work_example_integrations_title(),
            description: m.work_example_integrations_desc(),
        },
        {
            icon: Workflow,
            title: m.work_example_automation_title(),
            description: m.work_example_automation_desc(),
        },
        {
            icon: Globe,
            title: m.work_example_websites_title(),
            description: m.work_example_websites_desc(),
        },
        {
            icon: Smartphone,
            title: m.work_example_mobile_title(),
            description: m.work_example_mobile_desc(),
        },
        {
            icon: Wrench,
            title: m.work_example_consulting_title(),
            description: m.work_example_consulting_desc(),
        },
    ]
}

interface BuildExamplesSectionProps {
    showSubtitle?: boolean
}

export function BuildExamplesSection({ showSubtitle = true }: BuildExamplesSectionProps) {
    const examples = useBuildExamples()

    return (
        <section id="work" aria-label="Build examples" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 md:px-12">
            <FadeIn>
                <div className="mb-12 flex flex-col gap-4 sm:mb-16 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-accent">{m.work_selected()}</p>
                        {showSubtitle ? (
                            <p className="max-w-2xl text-base leading-relaxed text-text-muted sm:text-lg">{m.work_subtitle()}</p>
                        ) : null}
                    </div>
                    <p className="max-w-sm text-sm leading-relaxed text-text-subtle">
                        <span className="font-semibold text-text-muted">{m.work_clients_label()}:</span> {m.work_clients_desc()}
                    </p>
                </div>
            </FadeIn>

            <StaggerContainer staggerDelay={0.08} className="grid grid-cols-1 gap-x-10 gap-y-0 md:grid-cols-2 xl:grid-cols-3">
                {examples.map((example) => {
                    const Icon = example.icon

                    return (
                        <StaggerItem key={example.title} className="h-full">
                            <motion.article
                                className="group flex h-full flex-col border-t border-border py-8 transition-colors duration-500 hover:border-accent sm:py-10"
                                whileHover={{ y: -4 }}
                                transition={{ duration: 0.25, ease: smoothEase }}
                            >
                                <div className="mb-8 flex items-start">
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
                                <p className="max-w-sm text-sm leading-relaxed text-text-muted sm:text-base">{example.description}</p>
                            </motion.article>
                        </StaggerItem>
                    )
                })}
            </StaggerContainer>
        </section>
    )
}
