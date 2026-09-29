import { createRouter } from '@tanstack/react-router'
import { deLocalizeUrl, localizeUrl } from './paraglide/runtime.js'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

// Create a new router instance
export const getRouter = () => {
    const router = createRouter({
        routeTree,
        rewrite: {
            input: ({ url }) => deLocalizeUrl(url),
            output: ({ url }) => localizeUrl(url),
        },
        defaultPreload: 'intent',
        // Back/forward restores the scroll position (instantly: it happens under the route curtain).
        scrollRestoration: true,
        scrollRestorationBehavior: 'instant',
        // Hash links scroll through Lenis (src/components/motion/MotionRuntime.tsx).
        defaultHashScrollIntoView: false,
    })

    return router
}
