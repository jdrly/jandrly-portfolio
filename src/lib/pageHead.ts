import { createSeoHead, createVerificationMeta } from './seo'
import { createPageStructuredData } from './structuredData'
import type { IndexedPage } from './seo'

/**
 * `head()` of an indexed page: meta, canonical + hreflang links and the JSON-LD graph. The homepage (both
 * locales) also carries the search engine ownership tokens that are set.
 */
export function createPageHead(path: IndexedPage, title: string, description: string) {
    const head = createSeoHead({ path, title, description, structuredData: createPageStructuredData({ path, title, description }) })

    return path === '/' ? { ...head, meta: [...head.meta, ...createVerificationMeta()] } : head
}
