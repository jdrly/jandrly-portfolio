import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useCodeTypewriter, tokenizeLine, type Token, type TokenType } from '@/hooks/useCodeTypewriter'

const CODE_VARIANTS = [
    {
        label: 'React + Convex',
        lines: [
            '// AI-Powered Development',
            'async function deliverProject(client: Client) {',
            '  const requirements = await analyze(client.needs);',
            '',
            '  const solution = await ai.generate({',
            "    frontend: ['React', 'TypeScript', 'Tailwind'],",
            "    backend: ['Convex', 'Postgres', 'NestJS'],",
            "    timeline: 'rapid'",
            '  });',
            '',
            '  await build(solution);',
            "  await test({ coverage: '100%' });",
            '',
            '  return {',
            "    quality: 'exceptional',",
            "    delivery: 'on-time',",
            "    client: 'satisfied'",
            '  };',
            '}',
        ],
    },
    {
        label: 'Vue + Laravel',
        lines: [
            '// Full-Stack Laravel Solution',
            'async function buildWebApp(requirements: Requirements) {',
            '  const stack = await craft({',
            "    frontend: ['Vue', 'Inertia', 'Tailwind'],",
            "    backend: ['Laravel', 'PHP', 'MySQL'],",
            '    features: requirements.needs',
            '  });',
            '',
            '  await implement(stack);',
            '  await optimize({ caching: true });',
            '',
            '  return {',
            "    performance: 'blazing',",
            "    security: 'hardened',",
            "    scalability: 'enterprise'",
            '  };',
            '}',
        ],
    },
    {
        label: 'React Native',
        lines: [
            '// Cross-Platform Mobile',
            'async function createMobileApp(spec: MobileSpec) {',
            '  const app = await develop({',
            "    platforms: ['iOS', 'Android'],",
            "    framework: 'React Native',",
            "    performance: 'native-like'",
            '  });',
            '',
            '  await polish({',
            "    animations: 'smooth',",
            "    offline: 'enabled',",
            '    pushNotifications: true',
            '  });',
            '',
            '  return {',
            "    experience: 'seamless',",
            "    stores: ['App Store', 'Play Store']",
            '  };',
            '}',
        ],
    },
    {
        label: 'HubSpot CMS',
        lines: [
            '// HubSpot CMS Development',
            'async function buildCMSSite(brand: Brand) {',
            '  const site = await design({',
            "    platform: 'HubSpot',",
            "    features: ['CRM', 'Marketing', 'Analytics'],",
            "    customization: 'full'",
            '  });',
            '',
            '  await integrate({',
            '    forms: brand.leadCapture,',
            '    workflows: brand.automation,',
            '    reporting: brand.kpis',
            '  });',
            '',
            '  return {',
            "    leads: 'converting',",
            "    roi: 'measurable'",
            '  };',
            '}',
        ],
    },
]

const TOKEN_COLORS: Record<TokenType, string> = {
    keyword: 'text-purple-400',
    string: 'text-emerald-400',
    comment: 'text-text-subtle italic',
    function: 'text-blue-400',
    property: 'text-cyan-400',
    number: 'text-amber-400',
    operator: 'text-accent',
    punctuation: 'text-text-muted',
    type: 'text-yellow-400',
    text: 'text-text-muted',
}

function SyntaxHighlightedLine({ line }: { line: string }) {
    const tokens = tokenizeLine(line)

    return (
        <span>
            {tokens.map((token: Token, index: number) => (
                <span key={index} className={TOKEN_COLORS[token.type]}>
                    {token.value}
                </span>
            ))}
        </span>
    )
}

function CodeTypewriterDisplay() {
    const { displayedLines, isTyping, currentVariantLabel } = useCodeTypewriter({
        variants: CODE_VARIANTS,
        typingSpeed: 25,
        lineDelay: 80,
        startDelay: 800,
        variantDelay: 4000,
    })

    const codeContainerRef = useRef<HTMLDivElement>(null)
    const lastLineRef = useRef<HTMLDivElement>(null)

    // Auto-scroll within container only (not the page)
    useEffect(() => {
        const container = codeContainerRef.current
        const lastLine = lastLineRef.current

        if (container && lastLine) {
            // Calculate if the last line is below the visible area of the container
            const containerRect = container.getBoundingClientRect()
            const lastLineRect = lastLine.getBoundingClientRect()

            // Only scroll if the last line is outside the container's visible area
            const isBelow = lastLineRect.bottom > containerRect.bottom
            const isAbove = lastLineRect.top < containerRect.top

            if (isBelow || isAbove) {
                // Scroll within the container using scrollTop
                const scrollTarget = lastLine.offsetTop - container.clientHeight + lastLine.clientHeight + 16
                container.scrollTo({
                    top: Math.max(0, scrollTarget),
                    behavior: 'smooth',
                })
            }
        }
    }, [displayedLines.length])

    return (
        <div className="flex h-120 flex-col">
            {/* macOS Window Chrome - fixed header */}
            <div className="flex shrink-0 items-center gap-2 border-b border-border-subtle px-4 py-3">
                <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
                <div className="h-3 w-3 rounded-full bg-[#28c840]" />
                <span className="ml-4 font-mono text-xs text-text-subtle">deliver-value.ts</span>
            </div>

            {/* Code Content - scrollable area with hidden scrollbar */}
            <div ref={codeContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none p-4 md:p-6">
                <pre className="whitespace-pre-wrap wrap-break-word font-mono text-xs leading-relaxed md:text-sm md:leading-relaxed">
                    <code>
                        {displayedLines.map((line, index) => {
                            const isLastLine = index === displayedLines.length - 1
                            return (
                                <div key={index} ref={isLastLine ? lastLineRef : undefined} className="min-h-[1.5em]">
                                    <SyntaxHighlightedLine line={line} />
                                    {isLastLine && isTyping && <span className="ml-0.5 inline-block h-4 w-2 animate-pulse bg-accent" />}
                                </div>
                            )
                        })}
                    </code>
                </pre>
            </div>

            {/* Status Bar - fixed footer */}
            <div className="flex shrink-0 items-center justify-between border-t border-border-subtle px-4 py-2">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                    <span className="font-mono text-xs text-text-subtle">{currentVariantLabel}</span>
                </div>
                <span className="font-mono text-xs text-text-subtle">UTF-8</span>
            </div>
        </div>
    )
}

export function LetsTalkSection() {
    return (
        <section id="contact" aria-label="Contact call to action" className="relative overflow-hidden bg-bg px-6 py-32">
            {/* Background Decor */}
            <div className="absolute inset-0 z-0 bg-bg" aria-hidden="true">
                <div className="pointer-events-none absolute right-0 top-0 h-150 w-150 rounded-full bg-accent/5 blur-[120px]" />
                <div className="pointer-events-none absolute bottom-0 left-0 h-100 w-100 rounded-full bg-blue-500/5 blur-[100px]" />
                {/* Grid Pattern Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[64px_64px] mask-[radial-gradient(ellipse_at_center,black_50%,transparent_100%)]" />
            </div>

            <div className="relative z-10 mx-auto max-w-7xl">
                <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
                    <div>
                        <div className="mb-8 flex items-center gap-3">
                            <span className="h-px w-12 bg-accent" />
                            <span className="text-sm font-medium uppercase tracking-widest text-accent">Get in touch</span>
                        </div>

                        <h2 className="mb-8 text-5xl font-bold leading-[0.9] tracking-tight text-white md:text-7xl">
                            Let's build something <br />
                            <span className="text-accent">extraordinary.</span>
                        </h2>

                        <p className="mb-12 max-w-lg text-xl leading-relaxed text-text-muted">
                            Have a project in mind? I'm currently available for new opportunities. Let's discuss how we can solve your
                            problems.
                        </p>

                        <div className="flex flex-col gap-6 sm:flex-row">
                            <Link
                                to="/contact"
                                aria-label="Start a project - go to contact page"
                                className="group inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-accent px-8 py-4 text-sm font-bold uppercase tracking-wide text-black transition-colors hover:bg-accent-hover"
                            >
                                <span>Start a Project</span>
                                <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
                            </Link>

                            <div className="flex items-center gap-6 px-4">
                                <a
                                    href="mailto:jd@jandrly.cz"
                                    aria-label="Send email to jd@jandrly.cz"
                                    className="flex items-center gap-2 text-text-muted transition-colors hover:text-white"
                                >
                                    <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" aria-hidden="true" />
                                    jd@jandrly.cz
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="relative" aria-hidden="true">
                        {/* Code Editor Visual */}
                        <div className="group relative overflow-hidden rounded-2xl border border-border-subtle bg-[#0d0d0d] shadow-2xl shadow-black/50">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,107,80,0.08),transparent_50%)]" />

                            {/* Code Typewriter */}
                            <div className="relative">
                                <CodeTypewriterDisplay />
                            </div>
                        </div>

                        {/* Decorative Elements around the card */}
                        <div className="absolute -right-4 -top-4 h-24 w-24 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                        <div className="absolute -bottom-6 -left-6 z-[-1]">
                            <div className="flex gap-2">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="h-16 w-2 rounded-full bg-border-subtle" />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
