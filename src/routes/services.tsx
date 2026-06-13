import { createFileRoute } from '@tanstack/react-router'
import { ServicesPage } from '@/components/pages/ServicesPage'
import * as m from '@/paraglide/messages'

export const Route = createFileRoute('/services')({
    head: () => ({
        meta: [
            { title: m.meta_services_title() },
            {
                name: 'description',
                content: m.meta_services_description(),
            },
            { property: 'og:title', content: m.meta_services_title() },
            {
                property: 'og:description',
                content: m.meta_services_description(),
            },
        ],
    }),
    component: ServicesPage,
})
