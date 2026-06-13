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
                { rel: 'icon', href: '/favicon.png?v=20260613c', type: 'image/png', sizes: '512x512' },
                { rel: 'alternate icon', href: '/favicon.ico?v=20260613c', type: 'image/x-icon' },
                { rel: 'apple-touch-icon', href: '/apple-touch-icon.png?v=20260613c', sizes: '180x180' },
                { rel: 'manifest', href: '/manifest.json' },
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
