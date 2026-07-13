import { createFileRoute } from '@tanstack/react-router'
import { ContactPage } from '@/components/pages/contact/ContactPage'
import { createSeoHead } from '@/lib/seo'
import * as m from '@/paraglide/messages'

export const Route = createFileRoute('/contact')({
    head: () =>
        createSeoHead({
            title: m.meta_contact_title(),
            description: m.meta_contact_description(),
            path: '/contact',
        }),
    component: ContactPage,
})
