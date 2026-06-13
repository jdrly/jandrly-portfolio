import { m as motion } from 'framer-motion'
import { AppWindow, Cpu, Globe, Server, Smartphone, Workflow, Wrench } from 'lucide-react'
import { PageHero } from './PageHero'
import { LetsTalkSection } from '@/components/sections'
import { FadeIn, PageTransition, ScaleOnHover, SlideIn, StaggerContainer, StaggerItem, smoothEase } from '@/components/motion'
import * as m from '@/paraglide/messages'

function useServices() {
    return [
        {
            icon: AppWindow,
            title: m.service_webapp_title(),
            description: m.service_webapp_desc(),
            tags: ['React', 'Next.js', 'Laravel', 'Nest.js', 'PostgreSQL'],
        },
        {
            icon: Server,
            title: m.service_backend_title(),
            description: m.service_backend_desc(),
            tags: ['APIs', 'Laravel', 'Nest.js', 'PostgreSQL', 'HubSpot'],
        },
        {
            icon: Workflow,
            title: m.service_automation_title(),
            description: m.service_automation_desc(),
            tags: ['Internal Tools', 'Workflows', 'Imports', 'Exports', 'Admin'],
        },
        {
            icon: Globe,
            title: m.service_frontend_title(),
            description: m.service_frontend_desc(),
            tags: ['Next.js', 'PayloadCMS', 'React', 'Vue.js', 'CMS'],
        },
        {
            icon: Smartphone,
            title: m.service_mobile_title(),
            description: m.service_mobile_desc(),
            tags: ['iOS', 'macOS', 'Apps', 'APIs', 'Backend'],
        },
        {
            icon: Wrench,
            title: m.service_strategy_title(),
            description: m.service_strategy_desc(),
            tags: ['Architecture', 'Code Review', 'Planning', 'Handover'],
        },
        {
            icon: Cpu,
            title: m.service_hardware_title(),
            description: m.service_hardware_desc(),
            tags: ['IT Setup', 'Hardware', 'Consulting'],
        },
    ]
}

function useProcessSteps() {
    return [
        {
            number: '01',
            title: m.process_step_1_title(),
            description: m.process_step_1_desc(),
        },
        {
            number: '02',
            title: m.process_step_2_title(),
            description: m.process_step_2_desc(),
        },
        {
            number: '03',
            title: m.process_step_3_title(),
            description: m.process_step_3_desc(),
        },
        {
            number: '04',
            title: m.process_step_4_title(),
            description: m.process_step_4_desc(),
        },
    ]
}

function ServiceHero() {
    return (
        <PageHero label={m.services_label()} subtitle={m.services_subtitle()}>
            {m.services_heading_1()} <br />
            <span className="text-accent">{m.services_heading_2()}</span>
        </PageHero>
    )
}

interface ServiceCardProps {
    icon: React.ComponentType<{ size?: number }>
    title: string
    description: string
    tags: Array<string>
}

function ServiceCard({ icon: Icon, title, description, tags }: ServiceCardProps) {
    return (
        <ScaleOnHover scale={1.01}>
            <motion.div
                className="group relative overflow-hidden rounded-3xl border border-border-subtle bg-bg-card p-8 transition-colors hover:border-accent/50 will-change-transform"
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3, ease: smoothEase }}
            >
                <div
                    className="absolute inset-0 bg-linear-to-br from-accent/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    aria-hidden="true"
                />

                <div className="relative z-10">
                    <motion.div
                        className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-bg-elevated transition-all duration-300 group-hover:border-accent group-hover:text-accent"
                        aria-label={`${title} icon`}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ duration: 0.3, ease: smoothEase }}
                    >
                        <Icon size={28} />
                    </motion.div>

                    <h3 className="mb-4 text-2xl font-bold md:text-3xl">{title}</h3>

                    <p className="mb-8 leading-relaxed text-text-muted">{description}</p>

                    <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                            <span
                                key={tag}
                                className="rounded-full border border-border bg-bg-elevated px-3 py-1.5 text-xs font-medium text-[#aaaaaa]"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            </motion.div>
        </ScaleOnHover>
    )
}

function ServicesGrid() {
    const services = useServices()

    return (
        <section aria-label="Services offered" className="px-4 py-16 sm:px-6 sm:py-24">
            <StaggerContainer staggerDelay={0.15} className="mx-auto grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-2">
                {services.map((service) => (
                    <StaggerItem key={service.title}>
                        <ServiceCard icon={service.icon} title={service.title} description={service.description} tags={service.tags} />
                    </StaggerItem>
                ))}
            </StaggerContainer>
        </section>
    )
}

interface ProcessStepProps {
    number: string
    title: string
    description: string
    isLast?: boolean
    index: number
}

function ProcessStep({ number, title, description, isLast = false, index }: ProcessStepProps) {
    return (
        <SlideIn direction="left" delay={index * 0.1}>
            <motion.div
                className={`group flex gap-6 py-12 md:gap-10 ${isLast ? '' : 'border-b border-border-subtle'}`}
                whileHover={{ x: 10 }}
                transition={{ duration: 0.3, ease: smoothEase }}
            >
                <span className="font-mono text-4xl font-bold text-border-subtle transition-colors duration-500 group-hover:text-accent md:text-6xl">
                    {number}
                </span>

                <div className="pt-2 md:pt-4">
                    <h3 className="mb-4 text-2xl font-bold md:text-3xl">{title}</h3>
                    <p className="max-w-xl text-lg leading-relaxed text-text-muted">{description}</p>
                </div>
            </motion.div>
        </SlideIn>
    )
}

function ProcessSection() {
    const processSteps = useProcessSteps()

    return (
        <section aria-label="Work process" className="bg-[#0a0a0a] px-4 py-16 sm:px-6 sm:py-24 lg:py-32">
            <div className="mx-auto max-w-5xl">
                <div className="mb-16">
                    <FadeIn>
                        <div className="mb-8 flex items-center gap-3">
                            <span className="h-px w-12 bg-border" aria-hidden="true" />
                            <span className="text-sm font-medium uppercase tracking-widest text-accent">{m.process_label()}</span>
                        </div>
                    </FadeIn>

                    <FadeIn delay={0.1}>
                        <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
                            {m.process_heading()}
                        </h2>
                    </FadeIn>

                    <FadeIn delay={0.2}>
                        <p className="max-w-2xl text-xl leading-relaxed text-text-muted">{m.process_subtitle()}</p>
                    </FadeIn>
                </div>

                <div>
                    {processSteps.map((step, index) => (
                        <ProcessStep
                            key={step.number}
                            number={step.number}
                            title={step.title}
                            description={step.description}
                            isLast={index === processSteps.length - 1}
                            index={index}
                        />
                    ))}
                </div>
            </div>
        </section>
    )
}

export function ServicesPage() {
    return (
        <PageTransition>
            <ServiceHero />
            <ServicesGrid />
            <ProcessSection />
            <LetsTalkSection />
        </PageTransition>
    )
}
