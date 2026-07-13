import { createFileRoute } from '@tanstack/react-router'
import { AboutPage } from '@/components/pages/AboutPage'
import { createSeoHead } from '@/lib/seo'
import * as m from '@/paraglide/messages'

export const Route = createFileRoute('/about')({
    head: () =>
        createSeoHead({
            title: m.meta_about_title(),
            description: m.meta_about_description(),
            path: '/about',
        }),
    component: AboutPage,
})
