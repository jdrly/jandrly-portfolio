import { createFileRoute } from '@tanstack/react-router'
import { createRobotsTxt } from '@/lib/seo'

/** Generated, so the sitemap URL always uses the canonical origin from `SITE`. */
export const Route = createFileRoute('/robots.txt')({
    server: {
        handlers: {
            GET: () =>
                new Response(createRobotsTxt(), {
                    headers: {
                        'Content-Type': 'text/plain; charset=utf-8',
                        'Cache-Control': 'public, max-age=3600',
                    },
                }),
        },
    },
})
