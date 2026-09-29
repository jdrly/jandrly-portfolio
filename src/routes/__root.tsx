import { createRootRoute } from '@tanstack/react-router'

import archivoLatinExtUrl from '@fontsource-variable/archivo/files/archivo-latin-ext-wght-normal.woff2?url'
import archivoLatinUrl from '@fontsource-variable/archivo/files/archivo-latin-wght-normal.woff2?url'
import appCss from '../styles.css?url'
import { RootDocument } from '@/components/layout/RootDocument'
import { RootLayout } from '@/components/layout/RootLayout'
import { RootNotFound } from '@/components/pages/RootNotFound'
import { SITE } from '@/lib/site'
import * as m from '@/paraglide/messages'
import { getLocale } from '@/paraglide/runtime'

function fontPreload(href: string) {
    return { rel: 'preload', href, as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' as const }
}

export const Route = createRootRoute({
    head: () => ({
        meta: [
            { charSet: 'utf-8' },
            { name: 'viewport', content: 'width=device-width, initial-scale=1' },
            { name: 'author', content: SITE.name },
            { name: 'theme-color', content: '#e6ecea' },
            // Fallbacks for URLs without a page route (the 404 page); every page route overrides both via createSeoHead.
            { title: `${m.notfound_eyebrow()} | ${SITE.name}` },
            { name: 'robots', content: 'noindex' },
        ],
        links: [
            // Archivo carries all copy and headlines; Czech diacritics live in the latin-ext subset.
            fontPreload(archivoLatinUrl),
            ...(getLocale() === 'cs' ? [fontPreload(archivoLatinExtUrl)] : []),
            { rel: 'stylesheet', href: appCss },
            {
                rel: 'shortcut icon',
                href: '/favicon.ico?v=20260929',
                type: 'image/x-icon',
                sizes: '16x16 32x32',
            },
            { rel: 'icon', href: '/favicon-16x16.png?v=20260929', type: 'image/png', sizes: '16x16' },
            { rel: 'icon', href: '/favicon-32x32.png?v=20260929', type: 'image/png', sizes: '32x32' },
            { rel: 'icon', href: '/favicon.svg?v=20260929', type: 'image/svg+xml', sizes: 'any' },
            { rel: 'apple-touch-icon', href: '/apple-touch-icon.png?v=20260929', sizes: '180x180' },
            { rel: 'manifest', href: '/manifest.json?v=20260929' },
        ],
    }),

    notFoundComponent: RootNotFound,
    component: RootLayout,
    shellComponent: RootDocument,
})
