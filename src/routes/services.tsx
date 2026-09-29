import { createFileRoute } from '@tanstack/react-router'
import { ServicesPage } from '@/components/pages/ServicesPage'
import { createPageHead } from '@/lib/pageHead'
import * as m from '@/paraglide/messages'

export const Route = createFileRoute('/services')({
    head: () => createPageHead('/services', m.meta_services_title(), m.meta_services_description()),
    component: ServicesPage,
})
