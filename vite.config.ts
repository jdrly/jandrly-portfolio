import { execFileSync } from 'node:child_process'
import { URL, fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { paraglideVitePlugin } from '@inlang/paraglide-js'

import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const BOTID_PATH = '/149e9513-01fa-4fb0-aad4-566afd725d1b/2d206a39-8ed7-437e-a3be-862e0f06eea3'

/** Commit date (ISO 8601) of the last change to page content or copy. Empty outside a git checkout. */
function getContentLastModified() {
    try {
        return execFileSync('git', ['log', '-1', '--format=%cI', '--', 'messages', 'src/components', 'src/routes'], {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
        }).trim()
    } catch {
        return ''
    }
}

// Sitemap `lastmod` (`CONTENT_LASTMOD` in src/lib/seo.ts). Vite exposes VITE_* variables from process.env.
process.env.VITE_CONTENT_LASTMOD ||= getContentLastModified()

// Vercel Web Analytics is served by Vercel deployments only (`VERCEL=1` during Vercel builds). Local and CI builds
// skip it, so their pages don't log a 404 for /_vercel/insights/script.js.
process.env.VITE_VERCEL_ANALYTICS ||= process.env.VERCEL === '1' ? 'true' : ''

const config = defineConfig({
    server: {
        host: 'localhost',
        port: 4000,
        strictPort: true,
    },
    build: {
        rolldownOptions: {
            output: {
                codeSplitting: {
                    groups: [
                        {
                            name: 'react',
                            test: /node_modules[\\/](?:react|react-dom|scheduler)[\\/]/,
                            priority: 30,
                        },
                        {
                            name: 'tanstack',
                            // Router/Start only. TanStack Form (and its devtools/pacer helpers) is used by the contact
                            // form alone, so it stays in the lazily loaded contact chunk instead of the shared entry.
                            test: /node_modules[\\/]@tanstack[\\/](?!(?:react-form|form-core|devtools-event-client|pacer-lite)[\\/])/,
                            priority: 20,
                        },
                    ],
                },
            },
        },
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    plugins: [
        devtools(),
        nitro({
            // Pre-compressed .br/.gz copies of the static assets for the Node server (`pnpm start`, the CI SEO check,
            // a future non-Vercel host). Vercel's CDN compresses on its own, so Vercel builds skip them.
            compressPublicAssets: process.env.VERCEL === '1' ? false : { gzip: true, brotli: true },
            routeRules: {
                // Unhashed images (portrait, grain textures): cache for a week, then revalidate in the background.
                // Hashed build output under /assets is already `immutable`.
                // Keep header-only rules to paths that exist as static files: the Vercel preset emits them as routes
                // without `continue`, so a catch-all (`/**`) rule would stop routing before BotID and the SSR function.
                '/images/**': { headers: { 'Cache-Control': 'public, max-age=604800, stale-while-revalidate=2592000' } },
                // Vercel BotID challenge/proxy endpoints (https://vercel.com/docs/botid/get-started, "other frameworks").
                // Nitro's Vercel preset turns external proxy rules into CDN-level rewrites in .vercel/output/config.json.
                [`${BOTID_PATH}/a-4-a/c.js`]: {
                    proxy: 'https://api.vercel.com/bot-protection/v1/challenge',
                    headers: { 'X-Frame-Options': 'SAMEORIGIN' },
                },
                [`${BOTID_PATH}/**`]: {
                    proxy: 'https://api.vercel.com/bot-protection/v1/proxy/**',
                    headers: { 'X-Frame-Options': 'SAMEORIGIN' },
                },
            },
        }),
        paraglideVitePlugin({
            project: './project.inlang',
            outdir: './src/paraglide',
            outputStructure: 'message-modules',
            cookieName: 'PARAGLIDE_LOCALE',
            strategy: ['url', 'cookie', 'preferredLanguage', 'baseLocale'],
            urlPatterns: [
                {
                    pattern: '/:path(.*)?',
                    localized: [
                        // English must come first - more specific pattern should match before catch-all
                        ['en', '/en/:path(.*)?'],
                        ['cs', '/:path(.*)?'],
                    ],
                },
            ],
        }),
        tailwindcss(),
        tanstackStart(),
        viteReact(),
    ],
})

export default config
