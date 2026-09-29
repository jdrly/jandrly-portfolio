import { createFileRoute, notFound } from '@tanstack/react-router'
import { StyleguidePage } from '@/components/pages/StyleguidePage'
import { SITE } from '@/lib/site'

/** Dev-only visual reference of the design system (Typography + Components boards of personal.pen). */
export const Route = createFileRoute('/styleguide')({
    beforeLoad: () => {
        if (!import.meta.env.DEV) {
            throw notFound()
        }
    },
    head: () => ({
        meta: [{ title: `Styleguide · ${SITE.name}` }, { name: 'robots', content: 'noindex, nofollow' }],
    }),
    component: StyleguidePage,
})
