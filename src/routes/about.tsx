import { createFileRoute } from '@tanstack/react-router'
import { AboutPage } from '@/components/pages/AboutPage'
import { createPageHead } from '@/lib/pageHead'
import * as m from '@/paraglide/messages'

export const Route = createFileRoute('/about')({
    head: () => createPageHead('/about', m.meta_about_title(), m.meta_about_description()),
    component: AboutPage,
})
