import { useState, useEffect, useRef } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { LetsTalkSection } from '@/components/sections'
import { useTypewriter } from '@/hooks'

export const Route = createFileRoute('/')({ component: HomePage })

// --- Hero Section ---
function Hero() {
    const { scrollY } = useScroll()
    const y = useTransform(scrollY, [0, 500], [0, 200])
    const opacity = useTransform(scrollY, [0, 300], [1, 0])

    const { displayText } = useTypewriter({
        words: ['engineer', 'developer', 'consultant'],
    })

    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.playbackRate = 0.75
        }
    }, [])

    return (
        <section
            aria-label="Hero introduction"
            className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden"
        >
            {/* Main Text */}
            <motion.div style={{ y, opacity }} className="relative z-10 flex min-h-[15vw] flex-col items-center justify-center">
                <motion.h1
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-center text-center text-[13vw] font-semibold leading-none tracking-tight text-white"
                >
                    <span>/</span>
                    <span aria-live="polite" aria-atomic="true">
                        {displayText}
                    </span>
                    <motion.span
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        className="ml-2 block h-[10vw] w-[2vw] bg-white"
                        aria-hidden="true"
                    />
                </motion.h1>
            </motion.div>

            {/* Background Visuals */}
            <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
                <video
                    ref={videoRef}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 h-full w-full object-cover opacity-40 grayscale"
                >
                    <source src="/videos/bg.webm" type="video/webm" />
                </video>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050505_90%)]" />
                <div className="absolute inset-0 bg-black/50" />
            </div>

            {/* Bottom Left - Status */}
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
                    <span className="text-xs font-medium text-gray-300">Available for new projects</span>
                </div>
                <div className="ml-2 text-sm font-medium leading-tight text-white">
                    Building the
                    <br />
                    future, today.
                </div>
            </motion.div>

            {/* Bottom Right - Contact */}
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

// --- Benefits Section ---
const services = [
    {
        title: 'Frontend Development',
        description:
            'Pixel-perfect, responsive interfaces built with modern frameworks. I focus on performance, accessibility, and delightful interactions.',
        tag: 'Frontend',
    },
    {
        title: 'Backend Engineering',
        description:
            'Robust, scalable server-side architectures. From API design to database optimization, ensuring your application runs smoothly under load.',
        tag: 'Backend',
    },
    {
        title: 'Technical Strategy',
        description:
            'Making the right technical decisions early on. I help with stack selection, architecture planning, and technical roadmap development.',
        tag: 'Strategy',
    },
    {
        title: 'Hardware Consultation',
        description:
            'Expert guidance on hardware selection, IoT architecture, and physical-digital system bridging. Optimizing the intersection of software and hardware.',
        tag: 'Hardware',
    },
]

function BenefitsSection() {
    return (
        <section aria-label="Services offered" className="mx-auto max-w-7xl px-6 py-32 md:px-12">
            <div className="mb-8 flex items-center gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-text-subtle">
                    Why launch slow when you can move fast?
                </span>
            </div>

            <h2 className="mb-24 max-w-5xl text-4xl font-medium leading-[1.1] tracking-tight text-white md:text-6xl lg:text-7xl">
                Clean, scalable code that helps you ship faster and grow your revenue.
            </h2>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {services.map((item, index) => (
                    <div
                        key={index}
                        className="group flex flex-col border-t border-border pt-8 transition-colors duration-500 hover:border-accent"
                    >
                        <div className="mb-6 flex items-start justify-between">
                            <span className="translate-y-2 transform text-xs font-bold uppercase tracking-widest text-accent opacity-0 transition-opacity group-hover:translate-y-0 group-hover:opacity-100">
                                {item.tag}
                            </span>
                            <span className="font-mono text-sm text-border">0{index + 1}</span>
                        </div>

                        <h3 className="mb-4 text-3xl font-bold leading-tight text-white transition-transform duration-300 group-hover:translate-x-2">
                            {item.title}
                        </h3>

                        <p className="max-w-sm leading-relaxed text-text-muted">{item.description}</p>
                    </div>
                ))}
            </div>
        </section>
    )
}

// --- Project Card ---
interface ProjectCardProps {
    title: string
    category: string
    image: string
    index: number
}

function ProjectCard({ title, category, image, index }: ProjectCardProps) {
    const [isHovered, setIsHovered] = useState(false)

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="group relative cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="aspect-4/3 overflow-hidden bg-bg-card">
                <motion.img
                    src={image}
                    alt={title}
                    className="h-full w-full object-cover opacity-80 transition-opacity duration-500 will-change-transform group-hover:opacity-100"
                    animate={{ scale: isHovered ? 1.05 : 1 }}
                    transition={{ duration: 0.6 }}
                />
            </div>
            <div className="mt-6 flex items-start justify-between border-t border-border pt-6">
                <div>
                    <h3 className="mb-1 text-2xl font-bold transition-colors group-hover:text-accent md:text-3xl">{title}</h3>
                    <p className="text-sm uppercase tracking-wider text-text-subtle">{category}</p>
                </div>
                <motion.div
                    animate={{ x: isHovered ? 5 : 0, opacity: isHovered ? 1 : 0.5 }}
                    className="rounded-full border border-border p-2 transition-all group-hover:border-accent group-hover:bg-accent group-hover:text-black"
                >
                    <ArrowRight size={20} />
                </motion.div>
            </div>
        </motion.div>
    )
}

// --- Work Gallery ---
const projects = [
    {
        title: 'NEBULA',
        category: 'Brand Identity',
        image: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1000&auto=format&fit=crop',
    },
    {
        title: 'QUANTUM',
        category: 'Web Design',
        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop',
    },
    {
        title: 'ECHO',
        category: 'Art Direction',
        image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000&auto=format&fit=crop',
    },
    {
        title: 'FLUX',
        category: 'Development',
        image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000&auto=format&fit=crop',
    },
]

function WorkGallery() {
    return (
        <section id="work" aria-label="Featured projects" className="mx-auto max-w-7xl px-6 py-24 md:px-12">
            <div className="mb-16 flex items-end justify-between">
                <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-accent">Selected Projects</h2>
                <span className="hidden text-sm text-border md:block">2024 — 2025</span>
            </div>

            <div className="grid grid-cols-1 gap-x-12 gap-y-24 md:grid-cols-2">
                {projects.map((project, index) => (
                    <ProjectCard key={index} {...project} index={index} />
                ))}
            </div>
        </section>
    )
}

// --- Home Page ---
function HomePage() {
    return (
        <>
            <Hero />
            <BenefitsSection />
            <WorkGallery />
            <LetsTalkSection />
        </>
    )
}
