import { createFileRoute } from '@tanstack/react-router'
import { Cpu, Layout, Server, Zap } from 'lucide-react'
import { LetsTalkSection } from '@/components/sections'

export const Route = createFileRoute('/services')({
    component: ServicesPage,
})

// Services data
const services = [
    {
        icon: Layout,
        title: 'Frontend Development',
        description:
            'Pixel-perfect, responsive interfaces built with modern frameworks. I focus on performance, accessibility, and delightful interactions.',
        tags: ['React', 'Next.js', 'Tailwind CSS', 'Framer Motion', 'TypeScript'],
    },
    {
        icon: Server,
        title: 'Backend Engineering',
        description:
            'Robust, scalable server-side architectures. From API design to database optimization, ensuring your application runs smoothly under load.',
        tags: ['Node.js', 'PostgreSQL', 'GraphQL', 'Supabase', 'Serverless'],
    },
    {
        icon: Cpu,
        title: 'Technical Strategy',
        description:
            'Making the right technical decisions early on. I help with stack selection, architecture planning, and technical roadmap development.',
        tags: [
            'Architecture',
            'Code Audits',
            'Performance Optimization',
            'Consulting',
        ],
    },
    {
        icon: Zap,
        title: 'Hardware Consultation',
        description:
            'Expert guidance on hardware selection, IoT architecture, and physical-digital system bridging. Optimizing the intersection of software and hardware.',
        tags: ['IoT', 'Embedded Systems', 'Hardware Spec', 'Integration'],
    },
]

// Process steps data
const processSteps = [
    {
        number: '01',
        title: 'Discovery & Strategy',
        description:
            'We start by understanding your goals, user needs, and technical constraints. This sets the foundation for a successful project.',
    },
    {
        number: '02',
        title: 'Architecture & Planning',
        description:
            'Defining the technical blueprint. We determine the optimal stack, hardware requirements, and system architecture for a robust foundation.',
    },
    {
        number: '03',
        title: 'Development',
        description:
            'Writing clean, efficient code. I build your product using modern best practices, with regular updates and demos.',
    },
    {
        number: '04',
        title: 'Launch & Iterate',
        description:
            'Deployment is just the beginning. I help you launch smoothly and continue to improve based on real user feedback.',
    },
]

// ServiceHero Section
function ServiceHero() {
    return (
        <section
            aria-label="Services hero"
            className="relative flex min-h-[60vh] flex-col items-center justify-center overflow-hidden px-6 pb-20 pt-32 text-center"
        >
            {/* Background gradients */}
            <div className="absolute inset-0 z-0 bg-bg" aria-hidden="true">
                <div className="absolute right-0 top-0 h-full w-full bg-[radial-gradient(circle_at_80%_20%,rgba(255,107,80,0.05),transparent_60%)]" />
                <div className="absolute bottom-0 left-0 h-full w-full bg-[radial-gradient(circle_at_20%_80%,rgba(79,70,229,0.05),transparent_60%)]" />
            </div>

            <div className="z-10 mx-auto max-w-5xl">
                {/* Capabilities label with decorative lines */}
                <div className="mb-8 flex items-center justify-center gap-3">
                    <span className="h-px w-12 bg-border" aria-hidden="true" />
                    <span className="text-sm font-medium uppercase tracking-widest text-accent">
                        Capabilities
                    </span>
                    <span className="h-px w-12 bg-border" aria-hidden="true" />
                </div>

                {/* Main heading */}
                <h1 className="mb-8 text-5xl font-bold leading-[0.9] tracking-tight md:text-7xl lg:text-8xl">
                    Beyond just <br />
                    <span className="text-accent">lines of code.</span>
                </h1>

                {/* Subtitle */}
                <p className="mx-auto max-w-2xl text-xl leading-relaxed text-text-muted md:text-2xl">
                    I help ambitious brands & startups build scalable,
                    high-performance digital products. From first concept to
                    final deployment.
                </p>
            </div>
        </section>
    )
}

// ServiceCard Component
interface ServiceCardProps {
    icon: React.ComponentType<{ size?: number }>
    title: string
    description: string
    tags: string[]
}

function ServiceCard({ icon: Icon, title, description, tags }: ServiceCardProps) {
    return (
        <div className="group relative overflow-hidden rounded-3xl border border-border-subtle bg-bg-card p-8 transition-colors hover:border-accent/50">
            {/* Hover gradient overlay */}
            <div
                className="absolute inset-0 bg-linear-to-br from-accent/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                aria-hidden="true"
            />

            <div className="relative z-10">
                {/* Icon container */}
                <div
                    className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-bg-elevated transition-all duration-300 group-hover:scale-110 group-hover:border-accent group-hover:text-accent"
                    aria-label={`${title} icon`}
                >
                    <Icon size={28} />
                </div>

                {/* Title */}
                <h3 className="mb-4 text-2xl font-bold md:text-3xl">{title}</h3>

                {/* Description */}
                <p className="mb-8 leading-relaxed text-text-muted">
                    {description}
                </p>

                {/* Tags */}
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
        </div>
    )
}

// ServicesGrid Section
function ServicesGrid() {
    return (
        <section aria-label="Services offered" className="px-6 py-24">
            <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-2">
                {services.map((service) => (
                    <ServiceCard
                        key={service.title}
                        icon={service.icon}
                        title={service.title}
                        description={service.description}
                        tags={service.tags}
                    />
                ))}
            </div>
        </section>
    )
}

// ProcessStep Component
interface ProcessStepProps {
    number: string
    title: string
    description: string
    isLast?: boolean
}

function ProcessStep({ number, title, description, isLast = false }: ProcessStepProps) {
    return (
        <div
            className={`group flex gap-6 py-12 md:gap-10 ${isLast ? '' : 'border-b border-border-subtle'}`}
        >
            {/* Step number */}
            <span className="font-mono text-4xl font-bold text-border-subtle transition-colors duration-500 group-hover:text-accent md:text-6xl">
                {number}
            </span>

            {/* Step content */}
            <div className="pt-2 md:pt-4">
                <h3 className="mb-4 text-2xl font-bold md:text-3xl">{title}</h3>
                <p className="max-w-xl text-lg leading-relaxed text-text-muted">
                    {description}
                </p>
            </div>
        </div>
    )
}

// ProcessSection
function ProcessSection() {
    return (
        <section
            aria-label="Work process"
            className="bg-[#0a0a0a] px-6 py-32"
        >
            <div className="mx-auto max-w-5xl">
                {/* Section header */}
                <div className="mb-16">
                    <div className="mb-8 flex items-center gap-3">
                        <span className="h-px w-12 bg-border" aria-hidden="true" />
                        <span className="text-sm font-medium uppercase tracking-widest text-accent">
                            Process
                        </span>
                    </div>

                    <h2 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
                        How I Work
                    </h2>

                    <p className="max-w-2xl text-xl leading-relaxed text-text-muted">
                        A structured approach that ensures quality and
                        transparency at every stage.
                    </p>
                </div>

                {/* Process steps */}
                <div>
                    {processSteps.map((step, index) => (
                        <ProcessStep
                            key={step.number}
                            number={step.number}
                            title={step.title}
                            description={step.description}
                            isLast={index === processSteps.length - 1}
                        />
                    ))}
                </div>
            </div>
        </section>
    )
}

// Main Services Page
function ServicesPage() {
    return (
        <main>
            <ServiceHero />
            <ServicesGrid />
            <ProcessSection />
            <LetsTalkSection />
        </main>
    )
}
