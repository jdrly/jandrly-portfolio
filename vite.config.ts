import { URL, fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { paraglideVitePlugin } from '@inlang/paraglide-js'

import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

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
                            test: /node_modules[\\/]@tanstack[\\/]/,
                            priority: 20,
                        },
                        {
                            name: 'motion',
                            test: /node_modules[\\/](?:framer-motion|motion-dom|motion-utils)[\\/]/,
                            priority: 10,
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
        nitro(),
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
