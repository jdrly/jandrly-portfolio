import { createFileRoute } from '@tanstack/react-router'
import {
    Users,
    Terminal,
    Heart,
    Target,
    Code,
    Server,
    Layers,
    Database,
    Cpu,
} from 'lucide-react'
import { LetsTalkSection } from '@/components/sections'

export const Route = createFileRoute('/about')({
    component: AboutPage,
})

// Stats data
const stats = [
    { value: '05', label: 'Years Coding' },
    { value: '120+', label: 'Projects Shipped' },
    { value: '50k', label: 'Lines of Code' },
    { value: '∞', label: 'Coffee Consumed' },
]

// Values data
const values = [
    {
        icon: Terminal,
        title: 'Clean Code',
        description:
            'Writing maintainable, readable code that stands the test of time. Every line serves a purpose.',
    },
    {
        icon: Heart,
        title: 'User Centric',
        description:
            'Designing with empathy. Every feature solves a real problem for real people.',
    },
    {
        icon: Target,
        title: 'Performance',
        description:
            'Speed is a feature. Optimizing every millisecond to deliver lightning-fast experiences.',
    },
]

// Tech stack data
const techStack = [
    { icon: Code, name: 'React' },
    { icon: Terminal, name: 'TypeScript' },
    { icon: Server, name: 'Node.js' },
    { icon: Layers, name: 'Next.js' },
    { icon: Database, name: 'PostgreSQL' },
    { icon: Cpu, name: 'System Design' },
]

function AboutPage() {
    return (
        <main>
            <HeroSection />
            <BioSection />
            <StatsSection />
            <ValuesSection />
            <TechStackSection />
            <LetsTalkSection />
        </main>
    )
}

// ============================================================================
// Hero Section
// ============================================================================
function HeroSection() {
    return (
        <section className="relative min-h-[80vh] flex flex-col items-center justify-center px-6 pt-32 pb-20 overflow-hidden">
            {/* Background with radial gradient */}
            <div className="absolute inset-0 z-0 bg-bg">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(255,107,80,0.08),transparent_70%)]" />
            </div>

            <div className="z-10 max-w-4xl mx-auto text-center">
                {/* Label with decorative lines */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    <span className="h-px w-12 bg-border" />
                    <span className="text-sm font-medium text-text-muted uppercase tracking-widest">
                        My Story
                    </span>
                    <span className="h-px w-12 bg-border" />
                </div>

                {/* Main heading */}
                <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-8 leading-[0.9]">
                    I craft <span className="text-accent">digital</span>
                    <br />
                    <span className="italic font-light">experiences.</span>
                </h1>

                {/* Subtitle */}
                <p className="text-xl md:text-2xl text-text-muted leading-relaxed max-w-2xl mx-auto">
                    Born at the intersection of art and code, I transform ideas
                    into digital realities that inspire, engage, and deliver
                    results.
                </p>
            </div>
        </section>
    )
}

// ============================================================================
// Bio Section
// ============================================================================
function BioSection() {
    return (
        <section className="py-24 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    {/* Left: Portrait placeholder */}
                    <div className="relative aspect-3/4 md:aspect-square bg-bg-card rounded-2xl overflow-hidden border border-border-subtle group">
                        {/* Placeholder content */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-border group-hover:text-text-subtle transition-colors">
                            <Users size={48} className="mb-4 opacity-50" />
                            <span className="text-sm uppercase tracking-widest font-medium">
                                Portrait Slot
                            </span>
                        </div>

                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-linear-to-tr from-accent/5 to-transparent opacity-50" />

                        {/* Corner accents */}
                        <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-border" />
                        <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-border" />
                    </div>

                    {/* Right: Bio text */}
                    <div className="space-y-6">
                        {/* Label */}
                        <div className="flex items-center gap-3">
                            <span className="h-px w-12 bg-border" />
                            <span className="text-sm font-medium text-text-muted uppercase tracking-widest">
                                Who I Am
                            </span>
                        </div>

                        {/* Title */}
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
                            A developer with a{' '}
                            <span className="text-accent">passion</span> for
                            craft.
                        </h2>

                        {/* Bio paragraphs */}
                        <div className="space-y-4 text-lg text-text-muted leading-relaxed">
                            <p>
                                I'm a full-stack developer with over five years
                                of experience building digital products that
                                people love to use. My journey started with
                                curiosity—tinkering with HTML in my bedroom—and
                                evolved into a career dedicated to crafting
                                exceptional user experiences.
                            </p>
                            <p>
                                Today, I specialize in React ecosystems, modern
                                TypeScript, and cloud-native architectures. But
                                beyond the tech stack, I believe in writing code
                                that tells a story—clean, purposeful, and human.
                            </p>
                            <p>
                                When I'm not coding, you'll find me exploring
                                new design trends, contributing to open source,
                                or hunting for the perfect espresso.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

// ============================================================================
// Stats Section
// ============================================================================
function StatsSection() {
    return (
        <section className="py-20 px-6 border-y border-border-subtle">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {stats.map((stat) => (
                        <div
                            key={stat.label}
                            className="p-8 bg-bg-card/50 border border-border-subtle rounded-2xl text-center"
                        >
                            <div className="text-4xl md:text-5xl font-bold text-accent mb-2">
                                {stat.value}
                            </div>
                            <div className="text-sm text-text-muted uppercase tracking-widest">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

// ============================================================================
// Values Section
// ============================================================================
function ValuesSection() {
    return (
        <section className="py-32 px-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                        My Philosophy
                    </h2>
                    <p className="text-xl text-text-muted max-w-2xl mx-auto">
                        The principles that guide every line of code I write and
                        every pixel I push.
                    </p>
                </div>

                {/* Values grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {values.map((value, index) => {
                        const Icon = value.icon
                        return (
                            <div
                                key={value.title}
                                className="relative p-8 border border-border-subtle rounded-2xl bg-bg-card/30 group hover:bg-bg-card/50 transition-colors"
                            >
                                {/* Number badge */}
                                <div className="absolute top-4 right-4 text-sm text-text-subtle font-mono">
                                    0{index + 1}
                                </div>

                                {/* Icon */}
                                <div
                                    role="img"
                                    aria-label={`${value.title} icon`}
                                    className="w-14 h-14 flex items-center justify-center rounded-full bg-accent/10 text-accent mb-6"
                                >
                                    <Icon size={24} aria-hidden="true" />
                                </div>

                                {/* Content */}
                                <h3 className="text-xl font-semibold mb-3">
                                    {value.title}
                                </h3>
                                <p className="text-text-muted leading-relaxed">
                                    {value.description}
                                </p>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

// ============================================================================
// Tech Stack Section
// ============================================================================
function TechStackSection() {
    return (
        <section className="py-32 px-6 bg-[#0a0a0a]">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                        Tech Stack
                    </h2>
                    <p className="text-xl text-text-muted max-w-2xl mx-auto">
                        The tools and technologies I use to bring ideas to life.
                    </p>
                </div>

                {/* Tech grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6">
                    {techStack.map((tech) => {
                        const Icon = tech.icon
                        return (
                            <div
                                key={tech.name}
                                className="group p-6 flex flex-col items-center gap-4 bg-bg-card/50 border border-border-subtle rounded-xl hover:border-accent/30 hover:bg-bg-card transition-colors"
                            >
                                <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-bg-elevated text-text-muted group-hover:text-accent transition-colors">
                                    <Icon size={24} />
                                </div>
                                <span className="text-sm font-medium text-text-muted group-hover:text-text transition-colors">
                                    {tech.name}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
