import { m as motion, useReducedMotion } from 'framer-motion'
import { Heart, Target, Terminal, Users } from 'lucide-react'
import { siConvex, siHubspot, siLaravel, siNestjs, siNextdotjs, siPayloadcms, siPostgresql, siReact, siVuedotjs } from 'simple-icons'
import { PageHero } from './PageHero'
import { LetsTalkSection } from '@/components/sections'
import { FadeIn, PageTransition, StaggerContainer, StaggerItem, smoothEase } from '@/components/motion'
import * as m from '@/paraglide/messages'

function useStats() {
    return [
        { value: '06', label: m.about_stat_years() },
        { value: '32', label: m.about_stat_projects() },
        { value: '06', label: m.about_stat_lines() },
        { value: '03', label: m.about_stat_coffee() },
    ]
}

function useValues() {
    return [
        {
            icon: Terminal,
            title: m.about_value_clean_title(),
            description: m.about_value_clean_desc(),
        },
        {
            icon: Heart,
            title: m.about_value_user_title(),
            description: m.about_value_user_desc(),
        },
        {
            icon: Target,
            title: m.about_value_perf_title(),
            description: m.about_value_perf_desc(),
        },
    ]
}

const techStack = [
    { icon: siReact, color: siReact.hex },
    { icon: siConvex, color: siConvex.hex },
    { icon: siNextdotjs, color: 'FFFFFF' },
    { icon: siLaravel, color: siLaravel.hex },
    { icon: siNestjs, color: siNestjs.hex },
    { icon: siPostgresql, color: siPostgresql.hex },
    { icon: siVuedotjs, color: siVuedotjs.hex },
    { icon: siPayloadcms, color: 'FFFFFF' },
    { icon: siHubspot, color: siHubspot.hex },
]

const slidingTechStack = [0, 1].flatMap((loop) =>
    techStack.map((item) => ({
        ...item,
        loop,
        repeatKey: `${item.icon.slug}-${loop}`,
    })),
)

function HeroSection() {
    return (
        <PageHero label={m.about_story_label()} subtitle={m.about_hero_subtitle()}>
            {m.about_hero_heading_1()}
            <span className="text-accent">{m.about_hero_heading_accent()}</span>
            <br />
            <span className="italic font-light">{m.about_hero_heading_2()}</span>
        </PageHero>
    )
}

function BioSection() {
    return (
        <section className="py-16 px-4 sm:py-24 sm:px-6">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 gap-10 items-center sm:gap-16 md:grid-cols-2">
                    <FadeIn direction="left">
                        <div className="relative aspect-3/4 md:aspect-square bg-bg-card rounded-2xl overflow-hidden border border-border-subtle group">
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-border group-hover:text-text-subtle transition-colors">
                                <Users size={48} className="mb-4 opacity-50" />
                                <span className="text-sm uppercase tracking-widest font-medium">{m.about_portrait_slot()}</span>
                            </div>

                            <div className="absolute inset-0 bg-linear-to-tr from-accent/5 to-transparent opacity-50" />
                            <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-border" />
                            <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-border" />
                        </div>
                    </FadeIn>

                    <div className="space-y-6">
                        <FadeIn direction="right" delay={0}>
                            <div className="flex items-center gap-3">
                                <span className="h-px w-12 bg-border" />
                                <span className="text-sm font-medium text-text-muted uppercase tracking-widest">{m.about_who_label()}</span>
                            </div>
                        </FadeIn>

                        <FadeIn direction="right" delay={0.1}>
                            <h2 className="text-2xl font-bold tracking-tight leading-tight sm:text-4xl md:text-5xl">
                                {m.about_who_heading()}
                            </h2>
                        </FadeIn>

                        <FadeIn direction="right" delay={0.2}>
                            <div className="space-y-4 text-base text-text-muted leading-relaxed sm:text-lg">
                                <p>{m.about_bio_1()}</p>
                                <p>{m.about_bio_2()}</p>
                                <p>{m.about_bio_3()}</p>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </div>
        </section>
    )
}

function StatsSection() {
    const stats = useStats()

    return (
        <section className="py-12 px-4 sm:py-20 sm:px-6">
            <div className="max-w-7xl mx-auto">
                <StaggerContainer className="grid grid-cols-2 gap-x-6 gap-y-0 md:grid-cols-4">
                    {stats.map((stat) => (
                        <StaggerItem key={stat.label} className="h-full">
                            <motion.div
                                className="group flex h-full min-h-32 flex-col items-center justify-center py-8 text-center transition-colors duration-500 sm:min-h-40 sm:py-10"
                                whileHover={{ y: -4 }}
                                transition={{ duration: 0.25, ease: smoothEase }}
                            >
                                <div className="mb-4 whitespace-nowrap text-3xl font-bold leading-none text-accent sm:text-4xl md:text-5xl">
                                    {stat.value}
                                </div>
                                <div className="w-full max-w-72 text-xs leading-snug text-text-muted uppercase tracking-widest sm:text-sm">
                                    {stat.label}
                                </div>
                            </motion.div>
                        </StaggerItem>
                    ))}
                </StaggerContainer>
            </div>
        </section>
    )
}

function ValuesSection() {
    const values = useValues()

    return (
        <section className="py-16 px-4 sm:py-24 sm:px-6 lg:py-32">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-10 sm:mb-16">
                    <FadeIn>
                        <h2 className="text-3xl font-bold tracking-tight mb-4 sm:text-4xl sm:mb-6 md:text-5xl">
                            {m.about_philosophy_heading()}
                        </h2>
                    </FadeIn>
                    <FadeIn delay={0.1}>
                        <p className="mx-auto max-w-2xl text-balance text-base text-text-muted sm:text-xl">
                            {m.about_philosophy_subtitle()}
                        </p>
                    </FadeIn>
                </div>

                <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {values.map((value) => {
                        const Icon = value.icon
                        return (
                            <StaggerItem key={value.title} className="h-full">
                                <motion.div
                                    className="group flex h-full flex-col py-8 transition-colors duration-500 will-change-transform sm:py-10"
                                    whileHover={{ y: -5 }}
                                    transition={{ duration: 0.3, ease: smoothEase }}
                                >
                                    <div className="mb-8 flex items-start">
                                        <div
                                            className="w-14 h-14 flex items-center justify-center rounded-full bg-accent/10 text-accent"
                                            aria-hidden="true"
                                        >
                                            <Icon size={24} aria-hidden="true" />
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-semibold mb-3 transition-transform duration-300 group-hover:translate-x-2">
                                        {value.title}
                                    </h3>
                                    <p className="text-text-muted leading-relaxed">{value.description}</p>
                                </motion.div>
                            </StaggerItem>
                        )
                    })}
                </StaggerContainer>
            </div>
        </section>
    )
}

function TechStackSection() {
    const shouldReduceMotion = useReducedMotion()

    return (
        <section className="overflow-hidden px-4 py-16 sm:px-6 sm:py-24 lg:py-32">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-10 sm:mb-16">
                    <FadeIn>
                        <h2 className="text-3xl font-bold tracking-tight mb-4 sm:text-4xl sm:mb-6 md:text-5xl">{m.about_tech_heading()}</h2>
                    </FadeIn>
                    <FadeIn delay={0.1}>
                        <p className="mx-auto max-w-2xl text-balance text-base text-text-muted sm:text-xl">{m.about_tech_subtitle()}</p>
                    </FadeIn>
                </div>

                <FadeIn delay={0.15}>
                    <div className="relative -mx-4 overflow-hidden sm:-mx-6" aria-label={m.about_tech_heading()}>
                        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-linear-to-r from-bg to-transparent sm:w-32" />
                        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-linear-to-l from-bg to-transparent sm:w-32" />

                        <motion.ul
                            className="flex w-max items-center gap-12 py-6 motion-reduce:translate-x-0 sm:gap-16"
                            animate={shouldReduceMotion ? { x: 0 } : { x: ['0%', '-50%'] }}
                            transition={shouldReduceMotion ? { duration: 0 } : { duration: 28, ease: 'linear', repeat: Infinity }}
                        >
                            {slidingTechStack.map(({ icon, color, loop, repeatKey }) => (
                                <li
                                    key={repeatKey}
                                    className="flex min-w-24 shrink-0 flex-col items-center gap-4 text-text-muted sm:min-w-32"
                                    aria-hidden={loop > 0}
                                >
                                    <svg
                                        className="h-12 w-12 sm:h-16 sm:w-16"
                                        role="img"
                                        viewBox="0 0 24 24"
                                        aria-label={icon.title}
                                        fill={`#${color}`}
                                    >
                                        <path d={icon.path} />
                                    </svg>
                                    <span className="text-xs font-medium uppercase tracking-widest sm:text-sm">{icon.title}</span>
                                </li>
                            ))}
                        </motion.ul>
                    </div>
                </FadeIn>
            </div>
        </section>
    )
}

export function AboutPage() {
    return (
        <PageTransition>
            <HeroSection />
            <BioSection />
            <StatsSection />
            <ValuesSection />
            <TechStackSection />
            <LetsTalkSection />
        </PageTransition>
    )
}
