import { createFileRoute } from '@tanstack/react-router'
import { ContactPage } from '@/components/pages/contact/ContactPage'
import * as m from '@/paraglide/messages'

export const Route = createFileRoute('/contact')({
    head: () => ({
        meta: [
            { title: m.meta_contact_title() },
            {
                name: 'description',
                content: m.meta_contact_description(),
            },
            { property: 'og:title', content: m.meta_contact_title() },
            {
                property: 'og:description',
                content: m.meta_contact_description(),
            },
        ],
    }),
    component: ContactPage,
})
