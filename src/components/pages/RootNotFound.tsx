import { Link } from '@tanstack/react-router'

import { getLocale, localizeHref } from '@/paraglide/runtime'

export function RootNotFound() {
    const locale = getLocale()
    const copy =
        locale === 'cs'
            ? {
                  title: 'Stránka nenalezena',
                  description: 'Tahle adresa nevede na existující stránku.',
                  action: 'Zpět na úvod',
              }
            : {
                  title: 'Page not found',
                  description: 'This address does not point to an existing page.',
                  action: 'Back home',
              }

    return (
        <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-bg px-4 py-24 text-center sm:px-6">
            <div
                className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,107,80,0.08),transparent_70%)]"
                aria-hidden="true"
            />
            <div className="relative z-10 mx-auto max-w-3xl">
                <div className="mb-8 flex items-center justify-center gap-3">
                    <span className="h-px w-12 bg-border" aria-hidden="true" />
                    <span className="text-sm font-medium tracking-widest text-text-muted uppercase">404</span>
                    <span className="h-px w-12 bg-border" aria-hidden="true" />
                </div>
                <h1 className="mb-6 text-5xl font-bold tracking-tight text-white sm:text-7xl md:text-8xl">{copy.title}</h1>
                <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-balance text-text-muted sm:text-xl">
                    {copy.description}
                </p>
                <Link
                    to={localizeHref('/')}
                    className="inline-flex rounded-full bg-accent px-6 py-3 text-sm font-bold tracking-wide text-black uppercase transition-colors hover:bg-accent-hover"
                >
                    {copy.action}
                </Link>
            </div>
        </section>
    )
}
