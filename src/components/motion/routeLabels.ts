import * as m from '@/paraglide/messages'

export interface RouteLabel {
    /** Mono index, as in the navigation ("01"). */
    index: string
    title: string
}

/** Destination label shown on the route curtain. `pathname` is the router's (de-localized) path. */
export function routeLabel(pathname: string, hash = ''): RouteLabel {
    switch (pathname.replace(/\/$/, '') || '/') {
        case '/':
            return hash === 'work' ? { index: '03', title: m.nav_work() } : { index: '00', title: m.nav_home() }
        case '/about':
            return { index: '01', title: m.nav_about() }
        case '/services':
            return { index: '02', title: m.nav_services() }
        case '/contact':
            return { index: '04', title: m.nav_contact() }
        case '/privacy':
            return { index: '§', title: m.transition_privacy() }
        case '/styleguide':
            return { index: 'SG', title: 'Styleguide' }
        default:
            return { index: '404', title: m.notfound_eyebrow() }
    }
}
