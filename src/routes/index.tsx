import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: HomePage })

function HomePage() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center px-6">
            <div className="text-center max-w-2xl">
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
                    <span className="text-text">Jandrly</span>
                </h1>
                <p className="text-xl md:text-2xl text-text-muted mb-8">Full-Stack Developer</p>
                <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-bg-card border border-border">
                    <span className="relative flex h-3 w-3">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/75"></span>
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-accent"></span>
                    </span>
                    <span className="text-text-muted">Portfolio Coming Soon</span>
                </div>
            </div>
        </main>
    )
}
