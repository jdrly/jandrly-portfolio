/** Id of the element wrapping the whole page (everything except the motion overlays). */
export const APP_ROOT_ID = 'app-root'
/** Id of the visually hidden polite live region used for loading and route announcements. */
export const MOTION_STATUS_ID = 'motion-status'

/** Announce a status message to screen readers (polite). Re-setting the same text still announces. */
export function announce(message: string): void {
    const region = document.getElementById(MOTION_STATUS_ID)
    if (!region) return
    region.textContent = ''
    requestAnimationFrame(() => {
        region.textContent = message
    })
}

/** Make the page behind a full-screen overlay unreachable (focus, clicks, assistive tech) while it is up. */
export function setAppInert(inert: boolean): void {
    const root = document.getElementById(APP_ROOT_ID)
    if (root) root.inert = inert
}
