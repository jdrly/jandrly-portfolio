import { createRootRouteWithContext } from '@tanstack/react-router'

import appCss from '../styles.css?url'
import type { QueryClient } from '@tanstack/react-query'
import { RootDocument } from '@/components/layout/RootDocument'
import { RootLayout } from '@/components/layout/RootLayout'
import { RootNotFound } from '@/components/pages/RootNotFound'
import { getLocale } from '@/paraglide/runtime'

interface RouterContext {
    queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
    head: () => {
        const locale = getLocale()
        const ogLocale = locale === 'cs' ? 'cs_CZ' : 'en_US'

        return {
            meta: [
                { charSet: 'utf-8' },
                { name: 'viewport', content: 'width=device-width, initial-scale=1' },
                { title: 'Jandrly | Full-Stack Developer' },
                {
                    name: 'description',
                    content:
                        'Portfolio of Jan Drlý - Full-Stack Developer specializing in clean, scalable code that helps you ship faster and grow your revenue.',
                },
                { name: 'author', content: 'Jan Drlý' },
                { name: 'theme-color', content: '#000000' },

                // Open Graph
                { property: 'og:type', content: 'website' },
                { property: 'og:url', content: 'https://jandrly.cz' },
                { property: 'og:title', content: 'Jan Drlý | Full-Stack Developer' },
                {
                    property: 'og:description',
                    content: 'Full-Stack Developer specializing in clean, scalable code that helps you ship faster and grow your revenue.',
                },
                { property: 'og:image', content: 'https://jandrly.cz/og-image.png' },
                { property: 'og:site_name', content: 'Jandrly Portfolio' },
                { property: 'og:locale', content: ogLocale },

                // Twitter Card
                { name: 'twitter:card', content: 'summary_large_image' },
                { name: 'twitter:title', content: 'Jan Drlý | Full-Stack Developer' },
                { name: 'twitter:description', content: 'Full-Stack Developer specializing in clean, scalable code.' },
                { name: 'twitter:image', content: 'https://jandrly.cz/og-image.png' },
            ],
            links: [
                { rel: 'stylesheet', href: appCss },
                {
                    rel: 'shortcut icon',
                    href: '/favicon.ico?v=20260713c',
                    type: 'image/x-icon',
                    sizes: '16x16 24x24 32x32 48x48 64x64',
                },
                { rel: 'icon', href: '/favicon-16x16.png?v=20260713c', type: 'image/png', sizes: '16x16' },
                { rel: 'icon', href: '/favicon-32x32.png?v=20260713c', type: 'image/png', sizes: '32x32' },
                { rel: 'icon', href: '/favicon.svg?v=20260713c', type: 'image/svg+xml', sizes: 'any' },
                { rel: 'apple-touch-icon', href: '/apple-touch-icon.png?v=20260713c', sizes: '180x180' },
                { rel: 'manifest', href: '/manifest.json?v=20260713c' },
                { rel: 'canonical', href: 'https://jandrly.cz' },
            ],
        }
    },

    notFoundComponent: RootNotFound,
    component: RootRouteLayout,
    shellComponent: RootDocument,
})

function RootRouteLayout() {
    const { queryClient } = Route.useRouteContext()

    return <RootLayout queryClient={queryClient} />
}
