import { createFileRoute } from '@tanstack/react-router'
import { ServicesPage } from '@/components/pages/ServicesPage'
import { createSeoHead } from '@/lib/seo'
import * as m from '@/paraglide/messages'

export const Route = createFileRoute('/services')({
    head: () =>
        createSeoHead({
            title: m.meta_services_title(),
            description: m.meta_services_description(),
            path: '/services',
        }),
    component: ServicesPage,
})
