import { createFileRoute } from '@tanstack/react-router'
import { HomePage } from '@/components/pages/HomePage'
import * as m from '@/paraglide/messages'

export const Route = createFileRoute('/')({
    head: () => ({
        meta: [
            { title: m.meta_home_title() },
            {
                name: 'description',
                content: m.meta_home_description(),
            },
            { property: 'og:title', content: m.meta_home_title() },
            {
                property: 'og:description',
                content: m.meta_home_description(),
            },
        ],
    }),
    component: HomePage,
})
