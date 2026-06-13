import { createFileRoute } from '@tanstack/react-router'
import { AboutPage } from '@/components/pages/AboutPage'
import * as m from '@/paraglide/messages'

export const Route = createFileRoute('/about')({
    head: () => ({
        meta: [
            { title: m.meta_about_title() },
            {
                name: 'description',
                content: m.meta_about_description(),
            },
            { property: 'og:title', content: m.meta_about_title() },
            {
                property: 'og:description',
                content: m.meta_about_description(),
            },
        ],
    }),
    component: AboutPage,
})
