import { LazyMotion, MotionConfig, domAnimation } from 'framer-motion'
import { Outlet } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'

import { Provider as QueryProvider } from '@/integrations/tanstack-query/root-provider'
import { FloatingNav } from '@/components/layout/FloatingNav'
import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'
import * as m from '@/paraglide/messages'

export function RootLayout({ queryClient }: { queryClient: QueryClient }) {
    return (
        <QueryProvider queryClient={queryClient}>
            <LazyMotion features={domAnimation}>
                <MotionConfig reducedMotion="user">
                    <div className="flex min-h-screen flex-col">
                        <a
                            href="#main-content"
                            className="fixed left-4 top-4 z-60 -translate-y-24 rounded-full bg-white px-4 py-2 text-sm font-bold text-black transition-transform focus-visible:translate-y-0"
                        >
                            {m.skip_to_content()}
                        </a>
                        <Navbar />
                        <main id="main-content" className="flex-1">
                            <Outlet />
                        </main>
                        <Footer />
                        <FloatingNav />
                    </div>
                </MotionConfig>
            </LazyMotion>
        </QueryProvider>
    )
}
