import { createRootRouteWithContext } from '@tanstack/react-router'

import appCss from '../styles.css?url'
import type { QueryClient } from '@tanstack/react-query'
import { RootDocument } from '@/components/layout/RootDocument'
import { RootLayout } from '@/components/layout/RootLayout'
import { RootNotFound } from '@/components/pages/RootNotFound'

interface RouterContext {
    queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
    head: () => ({
        meta: [
            { charSet: 'utf-8' },
            { name: 'viewport', content: 'width=device-width, initial-scale=1' },
            { name: 'author', content: 'Jan Drlý' },
            { name: 'theme-color', content: '#050505' },
        ],
        links: [
            { rel: 'stylesheet', href: appCss },
            {
                rel: 'shortcut icon',
                href: '/favicon.ico?v=20260713d',
                type: 'image/x-icon',
                sizes: '16x16 24x24 32x32 48x48 64x64',
            },
            { rel: 'icon', href: '/favicon-16x16.png?v=20260713d', type: 'image/png', sizes: '16x16' },
            { rel: 'icon', href: '/favicon-32x32.png?v=20260713d', type: 'image/png', sizes: '32x32' },
            { rel: 'icon', href: '/favicon.svg?v=20260713d', type: 'image/svg+xml', sizes: 'any' },
            { rel: 'apple-touch-icon', href: '/apple-touch-icon.png?v=20260713d', sizes: '180x180' },
            { rel: 'manifest', href: '/manifest.json?v=20260713d' },
        ],
    }),

    notFoundComponent: RootNotFound,
    component: RootRouteLayout,
    shellComponent: RootDocument,
})

function RootRouteLayout() {
    const { queryClient } = Route.useRouteContext()

    return <RootLayout queryClient={queryClient} />
}
