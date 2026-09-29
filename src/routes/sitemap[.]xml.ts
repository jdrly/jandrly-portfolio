import { createFileRoute } from '@tanstack/react-router'
import { createSitemapXml } from '@/lib/seo'

/** Generated from `INDEXED_PAGES`, so it always matches the routes and their localized URLs. */
export const Route = createFileRoute('/sitemap.xml')({
    server: {
        handlers: {
            GET: () =>
                new Response(createSitemapXml(), {
                    headers: {
                        'Content-Type': 'application/xml; charset=utf-8',
                        'Cache-Control': 'public, max-age=3600',
                    },
                }),
        },
    },
})
