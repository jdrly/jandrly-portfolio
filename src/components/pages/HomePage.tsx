import { useEffect, useRef } from 'react'
import { m as motion, useInView, useScroll, useTransform } from 'framer-motion'
import { FadeIn, StaggerContainer, StaggerItem, smoothEase } from '@/components/motion'
import { BuildExamplesSection, LetsTalkSection } from '@/components/sections'
import { useTypewriter } from '@/hooks'
import * as m from '@/paraglide/messages'

function Hero() {
    const { scrollY } = useScroll()
    const y = useTransform(scrollY, [0, 500], [0, 200])
    const opacity = useTransform(scrollY, [0, 300], [1, 0])
    const sectionRef = useRef<HTMLElement>(null)
    const isInView = useInView(sectionRef, { amount: 0.1 })

    const { displayText } = useTypewriter({
        words: [m.hero_typewriter_engineer(), m.hero_typewriter_developer(), m.hero_typewriter_consultant()],
        enabled: isInView,
    })

    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        video.playbackRate = 0.75

        if (isInView) {
            void video.play()
        } else {
            video.pause()
        }
    }, [isInView])

    return (
        <section
            ref={sectionRef}
            aria-label="Hero introduction"
            className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden"
        >
            <motion.div
                style={{ y, opacity }}
                className="relative z-10 flex min-h-[20vw] max-w-6xl flex-col items-center justify-center px-4 sm:min-h-[15vw] sm:px-6"
            >
                <motion.h1
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-center text-center text-[15vw] font-semibold leading-none tracking-tight text-white sm:text-[13vw] md:text-[12vw] lg:text-[10vw]"
                >
                    <span>/</span>
                    <span aria-live="polite" aria-atomic="true">
                        {displayText}
                    </span>
                    <motion.span
                        animate={isInView ? { opacity: [0, 1, 0] } : { opacity: 0 }}
                        transition={isInView ? { duration: 0.8, repeat: Infinity } : { duration: 0.2 }}
                        className="ml-1 block h-[0.75em] w-[0.15em] bg-white sm:ml-2"
                        aria-hidden="true"
                    />
                </motion.h1>

                <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.35, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className="mt-6 max-w-3xl text-center text-base font-medium leading-relaxed text-gray-200 sm:text-xl md:text-2xl"
                >
                    {m.hero_tagline()}
                </motion.p>
            </motion.div>

            <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
                <video
                    ref={videoRef}
                    autoPlay
                    loop
                    muted
                    playsInline
                    aria-hidden="true"
                    tabIndex={-1}
                    className="absolute inset-0 h-full w-full object-cover opacity-40 grayscale"
                >
                    <source src="/videos/bg.webm" type="video/webm" />
                </video>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050505_90%)]" />
                <div className="absolute inset-0 bg-black/50" />
            </div>

            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="absolute bottom-8 left-8 z-20 hidden items-center gap-4 md:flex"
                aria-label="Availability status"
                role="status"
            >
                <div className="flex items-center gap-2 rounded-full border border-border bg-bg-card/80 px-4 py-2 backdrop-blur-sm">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" aria-hidden="true" />
                    <span className="text-xs font-medium text-gray-300">{m.hero_available()}</span>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="absolute bottom-8 right-8 z-20 hidden flex-col items-end gap-1 md:flex"
            >
                <a
                    href="mailto:jd@jandrly.cz"
                    className="font-medium text-white transition-colors hover:text-accent"
                    aria-label="Send email to jd@jandrly.cz"
                >
                    jd@jandrly.cz
                </a>
                <div className="h-0.5 w-8 bg-white" aria-hidden="true" />
            </motion.div>
        </section>
    )
}

function useServices() {
    return [
        {
            title: m.service_webapp_title(),
            description: m.service_webapp_desc(),
            tag: m.service_webapp_tag(),
        },
        {
            title: m.service_backend_title(),
            description: m.service_backend_desc(),
            tag: m.service_backend_tag(),
        },
        {
            title: m.service_automation_title(),
            description: m.service_automation_desc(),
            tag: m.service_automation_tag(),
        },
        {
            title: m.service_frontend_title(),
            description: m.service_frontend_desc(),
            tag: m.service_frontend_tag(),
        },
        {
            title: m.service_mobile_title(),
            description: m.service_mobile_desc(),
            tag: m.service_mobile_tag(),
        },
        {
            title: m.service_strategy_title(),
            description: m.service_strategy_desc(),
            tag: m.service_strategy_tag(),
        },
        {
            title: m.service_hardware_title(),
            description: m.service_hardware_desc(),
            tag: m.service_hardware_tag(),
        },
    ]
}

function BenefitsSection() {
    const services = useServices()

    return (
        <section aria-label="Services offered" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 md:px-12 lg:py-32">
            <FadeIn delay={0}>
                <div className="mb-8 flex items-center gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-text-subtle">{m.benefits_label()}</span>
                </div>
            </FadeIn>

            <FadeIn delay={0.1}>
                <h2 className="mb-12 max-w-5xl text-2xl font-medium leading-[1.1] tracking-tight text-white sm:mb-16 sm:text-4xl md:mb-24 md:text-6xl lg:text-7xl">
                    {m.benefits_heading()}
                </h2>
            </FadeIn>

            <StaggerContainer staggerDelay={0.08} delayChildren={0.15} className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2">
                {services.map((item, index) => (
                    <StaggerItem key={item.title}>
                        <motion.article
                            className="group flex h-full flex-col border-t border-border pt-6 transition-colors duration-500 hover:border-accent sm:pt-8"
                            whileHover={{ y: -4 }}
                            transition={{ duration: 0.25, ease: smoothEase }}
                        >
                            <div className="mb-4 flex items-start justify-between sm:mb-6">
                                <span className="translate-y-2 transform text-xs font-bold uppercase tracking-widest text-accent opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                                    {item.tag}
                                </span>
                                <span className="font-mono text-sm text-border">0{index + 1}</span>
                            </div>

                            <h3 className="mb-3 text-xl font-bold leading-tight text-white transition-transform duration-300 group-hover:translate-x-2 sm:mb-4 sm:text-3xl">
                                {item.title}
                            </h3>

                            <p className="max-w-sm text-sm leading-relaxed text-text-muted sm:text-base">{item.description}</p>
                        </motion.article>
                    </StaggerItem>
                ))}
            </StaggerContainer>
        </section>
    )
}

export function HomePage() {
    return (
        <>
            <Hero />
            <BenefitsSection />
            <BuildExamplesSection />
            <LetsTalkSection />
        </>
    )
}
