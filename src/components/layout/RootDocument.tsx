import { Suspense, lazy } from 'react'
import { ClientOnly, HeadContent, Scripts } from '@tanstack/react-router'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import type { ReactNode } from 'react'

import { MOTION_BOOT_SCRIPT } from '@/lib/motion/bootScript'
import { getLocale } from '@/paraglide/runtime'

const devtoolsConfig = {
    hideUntilHover: true,
    position: 'bottom-right' as const,
}

const devtoolsPlugins = [
    {
        name: 'Tanstack Router',
        render: <TanStackRouterDevtoolsPanel />,
    },
]

// Analytics is non-critical: keep it out of the initial bundle and load it only after hydration.
const Analytics = lazy(() => import('@vercel/analytics/react').then((mod) => ({ default: mod.Analytics })))

/** Set by vite.config.ts on Vercel builds only; the analytics script exists only on Vercel deployments. */
const ANALYTICS_ENABLED = import.meta.env.VITE_VERCEL_ANALYTICS === 'true'

export function RootDocument({ children }: { children: ReactNode }) {
    const locale = getLocale()

    return (
        // The head script may set `data-intro` / `data-cover` on <html> before hydration (intentional, attribute only).
        <html lang={locale} suppressHydrationWarning>
            <head>
                {/* Must run before the first paint: decides whether the intro or the arrive curtain covers the page. */}
                <script dangerouslySetInnerHTML={{ __html: MOTION_BOOT_SCRIPT }} />
                <HeadContent />
            </head>
            <body>
                {children}
                {ANALYTICS_ENABLED ? (
                    <ClientOnly>
                        <Suspense fallback={null}>
                            <Analytics />
                        </Suspense>
                    </ClientOnly>
                ) : null}
                <TanStackDevtools config={devtoolsConfig} plugins={devtoolsPlugins} />
                <Scripts />
            </body>
        </html>
    )
}
