import { createFileRoute } from '@tanstack/react-router'
import { HomePage } from '@/components/pages/HomePage'
import { HOME_CONTENT_ID } from '@/components/sections/homeHeroConstants'
import { createPageHead } from '@/lib/pageHead'
import * as m from '@/paraglide/messages'

export const Route = createFileRoute('/')({
    // The hero carries the site navigation on the homepage, so "skip to content" jumps past it to the headline.
    staticData: { hideHeader: true, skipTarget: HOME_CONTENT_ID },
    head: () => {
        const seo = createPageHead('/', m.meta_home_title(), m.meta_home_description())

        // The LCP portrait preload is emitted by HomeHero (react-dom `preload`), which React places at the top of <head>.
        return seo
    },
    component: HomePage,
})
