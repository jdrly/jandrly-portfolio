import { LazyMotion, MotionConfig, domAnimation } from 'framer-motion'
import { Outlet } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'

import { Provider as QueryProvider } from '@/integrations/tanstack-query/root-provider'
import { FloatingNav } from '@/components/layout/FloatingNav'
import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'

export function RootLayout({ queryClient }: { queryClient: QueryClient }) {
    return (
        <QueryProvider queryClient={queryClient}>
            <LazyMotion features={domAnimation}>
                <MotionConfig reducedMotion="user">
                    <div className="flex min-h-screen flex-col">
                        <Navbar />
                        <main className="flex-1">
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
