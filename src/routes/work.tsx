import { createFileRoute } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { LetsTalkSection } from '@/components/sections'

export const Route = createFileRoute('/work')({
    component: WorkPage,
})

interface Project {
    title: string
    category: string
    image: string
}

const PROJECTS: Project[] = [
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

function WorkHero() {
    return (
        <section
            aria-label="Portfolio hero"
            className="relative flex min-h-[50vh] flex-col items-center justify-center overflow-hidden px-6 pb-20 pt-32 text-center"
        >
            {/* Background with radial gradient */}
            <div className="absolute inset-0 z-0 bg-bg" aria-hidden="true">
                <div className="absolute left-0 top-0 h-full w-full bg-[radial-gradient(circle_at_20%_20%,rgba(255,107,80,0.05),transparent_60%)]" />
            </div>

            <div className="z-10 mx-auto max-w-5xl">
                {/* Label with decorative lines */}
                <div className="mb-8 flex items-center justify-center gap-3">
                    <span className="h-px w-12 bg-border" aria-hidden="true" />
                    <span className="text-sm font-medium uppercase tracking-widest text-accent">
                        Portfolio
                    </span>
                    <span className="h-px w-12 bg-border" aria-hidden="true" />
                </div>

                {/* Main heading */}
                <h1 className="mb-8 text-5xl font-bold leading-[0.9] tracking-tight md:text-7xl lg:text-8xl">
                    Selected <br />
                    <span className="text-accent">Work.</span>
                </h1>

                {/* Subtitle */}
                <p className="mx-auto max-w-2xl text-xl leading-relaxed text-text-muted md:text-2xl">
                    A curation of digital experiences, products, and experiments.
                </p>
            </div>
        </section>
    )
}

interface ProjectCardProps {
    project: Project
}

function ProjectCard({ project }: ProjectCardProps) {
    const { title, category, image } = project

    return (
        <article className="group relative cursor-pointer">
            {/* Image container */}
            <div className="aspect-4/3 overflow-hidden bg-bg-card">
                <img
                    src={image}
                    alt={`${title} - ${category} project`}
                    className="h-full w-full object-cover opacity-80 transition-opacity duration-500 group-hover:opacity-100"
                />
            </div>

            {/* Project info */}
            <div className="mt-6 flex items-start justify-between border-t border-border pt-6">
                <div>
                    <h3 className="mb-1 text-2xl font-bold transition-colors group-hover:text-accent md:text-3xl">
                        {title}
                    </h3>
                    <p className="text-sm uppercase tracking-wider text-text-subtle">
                        {category}
                    </p>
                </div>

                {/* Arrow icon */}
                <div
                    className="rounded-full border border-border p-2 opacity-50 transition-all group-hover:border-accent group-hover:bg-accent group-hover:text-black group-hover:opacity-100"
                    aria-hidden="true"
                >
                    <ArrowRight size={20} />
                </div>
            </div>
        </article>
    )
}

function WorkGallery() {
    return (
        <section
            id="work"
            aria-label="Selected projects gallery"
            className="mx-auto max-w-7xl px-6 py-24 md:px-12"
        >
            {/* Header row */}
            <div className="mb-16 flex items-end justify-between">
                <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-accent">
                    Selected Projects
                </h2>
                <span className="hidden text-sm text-border md:block">
                    2023 — 2024
                </span>
            </div>

            {/* Projects grid */}
            <div className="grid grid-cols-1 gap-x-12 gap-y-24 md:grid-cols-2">
                {PROJECTS.map((project) => (
                    <ProjectCard key={project.title} project={project} />
                ))}
            </div>
        </section>
    )
}

function WorkPage() {
    return (
        <main>
            <WorkHero />
            <WorkGallery />
            <LetsTalkSection />
        </main>
    )
}
