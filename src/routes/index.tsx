import { createFileRoute } from '@tanstack/react-router'
import { HomePage } from '@/components/pages/HomePage'
import { createHomeStructuredData, createSeoHead } from '@/lib/seo'
import * as m from '@/paraglide/messages'

export const Route = createFileRoute('/')({
    head: () =>
        createSeoHead({
            title: m.meta_home_title(),
            description: m.meta_home_description(),
            path: '/',
            structuredData: createHomeStructuredData(m.meta_home_description()),
        }),
    component: HomePage,
})
