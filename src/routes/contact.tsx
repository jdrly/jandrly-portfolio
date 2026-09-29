import { createFileRoute } from '@tanstack/react-router'
import { ContactPage } from '@/components/pages/contact/ContactPage'
import { createPageHead } from '@/lib/pageHead'
import * as m from '@/paraglide/messages'

export const Route = createFileRoute('/contact')({
    head: () => createPageHead('/contact', m.meta_contact_title(), m.meta_contact_description()),
    component: ContactPage,
})
