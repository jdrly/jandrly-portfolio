let initialized = false

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]'])

/**
 * Initializes Vercel BotID once, lazily, for the given POST endpoint.
 *
 * Only in production builds served from a real host: the BotID challenge
 * script is proxied by Vercel rewrites (see `vite.config.ts` route rules) that
 * do not exist in local dev/preview, where protected requests would otherwise
 * fail to load the challenge. The server skips the check off Vercel as well.
 */
export function initBotIdOnce(path: string) {
    if (initialized || !import.meta.env.PROD || typeof window === 'undefined' || LOCAL_HOSTNAMES.has(window.location.hostname)) {
        return
    }

    initialized = true

    void import('botid/client/core')
        .then(({ initBotId }) => initBotId({ protect: [{ path, method: 'POST' }] }))
        .catch((error: unknown) => {
            initialized = false
            console.error('BotID failed to initialize', error)
        })
}
