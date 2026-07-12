import { HeadContent, Scripts } from '@tanstack/react-router'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { Analytics } from '@vercel/analytics/react'
import type { ReactNode } from 'react'

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
    {
        name: 'Tanstack Query',
        render: <ReactQueryDevtoolsPanel />,
    },
]

export function RootDocument({ children }: { children: ReactNode }) {
    const locale = getLocale()

    return (
        <html lang={locale}>
            <head>
                <HeadContent />
            </head>
            <body>
                {children}
                <Analytics />
                <TanStackDevtools config={devtoolsConfig} plugins={devtoolsPlugins} />
                <Scripts />
            </body>
        </html>
    )
}
