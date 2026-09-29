import { Outlet, useMatches } from '@tanstack/react-router'
import { preload } from 'react-dom'

import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'
import * as m from '@/paraglide/messages'

declare module '@tanstack/react-router' {
    interface StaticDataRouteOption {
        /** The route renders its own navigation (the homepage hero), so the global header is skipped. */
        hideHeader?: boolean
        /**
         * Element id the "skip to content" link jumps to (defaults to `<main>`). Routes that render their
         * navigation inside `<main>` point it at the first content after that navigation; the target needs
         * `tabIndex={-1}` so it receives focus.
         */
        skipTarget?: string
    }
}

const MAIN_CONTENT_ID = 'main-content'

/**
 * Paper grain of the `bg-grain` utility (src/styles.css). Every page opens with a `bg-grain` hero, and the textured
 * hero is the LCP element on text pages; without a preload the browser finds the texture only after the stylesheet.
 */
const GRAIN_LIGHT_AVIF = '/images/grain-light.avif'

function selectHideHeader(matches: ReturnType<typeof useMatches>) {
    return matches.some((match) => match.staticData.hideHeader === true)
}

function selectSkipTarget(matches: ReturnType<typeof useMatches>) {
    // The deepest route that sets a target wins.
    return matches.reduce((target, match) => match.staticData.skipTarget ?? target, MAIN_CONTENT_ID)
}

export function RootLayout() {
    const hideHeader = useMatches({ select: selectHideHeader })
    const skipTarget = useMatches({ select: selectSkipTarget })
    preload(GRAIN_LIGHT_AVIF, { as: 'image', type: 'image/avif', fetchPriority: 'high' })

    return (
        <div className="flex min-h-screen flex-col">
            <a
                href={`#${skipTarget}`}
                className="fixed top-3 left-3 z-60 -translate-y-24 rounded-tl-xl rounded-br-xl bg-ink px-4 py-3 font-mono text-label text-paper uppercase transition-transform focus-visible:translate-y-0"
            >
                {m.skip_to_content()}
            </a>
            {hideHeader ? null : <Navbar />}
            <main id={MAIN_CONTENT_ID} tabIndex={-1} className="flex-1 focus:outline-none">
                <Outlet />
            </main>
            <Footer />
        </div>
    )
}
