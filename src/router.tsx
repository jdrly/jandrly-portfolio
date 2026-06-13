import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { getContext } from './integrations/tanstack-query/context'
import { deLocalizeUrl, localizeUrl } from './paraglide/runtime.js'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

// Create a new router instance
export const getRouter = () => {
    const rqContext = getContext()

    const router = createRouter({
        routeTree,
        context: {
            ...rqContext,
        },
        rewrite: {
            input: ({ url }) => deLocalizeUrl(url),
            output: ({ url }) => localizeUrl(url),
        },
        defaultPreload: 'intent',
    })

    setupRouterSsrQueryIntegration({ router, queryClient: rqContext.queryClient })

    return router
}
