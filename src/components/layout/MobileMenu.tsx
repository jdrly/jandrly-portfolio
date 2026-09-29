import { useEffect, useEffectEvent, useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { X } from 'lucide-react'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { NAV_ACTIVE_OPTIONS, NAV_ITEMS } from '@/components/layout/navItems'
import { Wordmark } from '@/components/layout/Wordmark'
import { ButtonLink } from '@/components/ui/Button'
import { SocialChip } from '@/components/ui/SocialChip'
import { socialLinks } from '@/lib/socialLinks'
import { cn } from '@/lib/utils'
import * as m from '@/paraglide/messages'

/** 44×44 outlined square with clipped corners (Nav / Mobile menu button). */
export const MENU_BUTTON_CLASS =
    'inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-tl-xl rounded-br-xl border-[1.5px] border-ink text-ink transition-colors duration-200 hover:bg-ink hover:text-paper'

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
const DESKTOP_QUERY = '(min-width: 64rem)'

/*
 * Native modal <dialog> (top layer, inert page behind it) with CSS-only transitions: `open` toggles `display` and
 * `overlay` (animated as discrete properties, so the fade-out finishes before the dialog leaves the top layer)
 * and opacity; `@starting-style` gives the fade-in its start value. Menu items rise in with a small stagger, only
 * when motion is allowed (no delay otherwise). `z-50` matters only where `overlay` can't be transitioned (Safari,
 * Firefox): there the dialog leaves the top layer as soon as it closes, and without it positioned page content
 * (hero / portrait) would paint above the menu for the whole fade-out.
 */
const DIALOG_CLASS =
    'bg-grain fixed inset-0 z-50 m-0 hidden h-full max-h-none w-full max-w-none flex-col overflow-y-auto overscroll-contain border-0 p-0 text-ink opacity-0 transition-[opacity,display,overlay] transition-discrete duration-250 ease-out-soft backdrop:bg-transparent open:opacity-100 max-lg:open:flex starting:open:opacity-0'

const ITEM_CLASS =
    'border-t-[1.5px] border-ink transition-[opacity,translate] duration-250 ease-out-soft motion-safe:starting:translate-y-3 motion-safe:starting:opacity-0'

/** Per-item enter delays (50ms + 40ms stagger), one static class per nav item. */
const ITEM_DELAY_CLASSES = [
    'motion-safe:delay-[50ms]',
    'motion-safe:delay-[90ms]',
    'motion-safe:delay-[130ms]',
    'motion-safe:delay-[170ms]',
]

/** Keep Tab / Shift+Tab cycling inside the dialog. */
function trapFocus(event: KeyboardEvent, container: HTMLElement | null) {
    if (!container) return
    const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
    }
}

interface MobileMenuProps {
    id: string
    isOpen: boolean
    onClose: () => void
}

/**
 * Full-screen, focus-trapped navigation dialog for viewports below `lg`. While open: focus moves to the close
 * button and cycles inside the dialog, Escape closes, page scroll is locked; on close focus returns to the opener.
 */
export function MobileMenu({ id, isOpen, onClose }: MobileMenuProps) {
    const dialogRef = useRef<HTMLDialogElement>(null)
    const closeButtonRef = useRef<HTMLButtonElement>(null)
    const requestClose = useEffectEvent(onClose)

    useEffect(() => {
        const dialog = dialogRef.current
        if (!isOpen || !dialog) return

        const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
        const previousOverflow = document.body.style.overflow
        if (!dialog.open) dialog.showModal()
        document.body.style.overflow = 'hidden'
        closeButtonRef.current?.focus()

        // The dialog only exists below `lg`; close it if the viewport grows past that.
        const desktopQuery = window.matchMedia(DESKTOP_QUERY)
        function handleViewportChange(event: MediaQueryListEvent) {
            if (event.matches) requestClose()
        }
        desktopQuery.addEventListener('change', handleViewportChange)

        return () => {
            desktopQuery.removeEventListener('change', handleViewportChange)
            if (dialog.open) dialog.close()
            document.body.style.overflow = previousOverflow
            previouslyFocused?.focus()
        }
    }, [isOpen])

    return (
        // Escape closes the native dialog itself; its `close` event syncs the state.
        <dialog
            ref={dialogRef}
            id={id}
            aria-label={m.nav_menu_label()}
            inert={!isOpen}
            onClose={onClose}
            onKeyDown={(event) => {
                if (event.key === 'Tab') trapFocus(event.nativeEvent, dialogRef.current)
            }}
            className={DIALOG_CLASS}
        >
            <div className="container-page flex items-center justify-between border-b-[1.5px] border-ink py-3.5">
                <Wordmark onNavigate={onClose} />
                <button ref={closeButtonRef} type="button" className={MENU_BUTTON_CLASS} aria-label={m.nav_menu_close()} onClick={onClose}>
                    <X aria-hidden="true" className="size-5" />
                </button>
            </div>

            <nav aria-label={m.nav_main_label()} className="container-page pt-8">
                <ul className="border-b-[1.5px] border-ink">
                    {NAV_ITEMS.map((item, index) => (
                        <li key={item.index} className={cn(ITEM_CLASS, ITEM_DELAY_CLASSES[index])}>
                            <Link
                                to={item.to}
                                hash={item.hash}
                                activeOptions={NAV_ACTIVE_OPTIONS}
                                onClick={onClose}
                                className="group flex items-baseline gap-4 py-4"
                            >
                                <span aria-hidden="true" className="w-6 font-mono text-label font-normal text-ink-soft">
                                    {item.index}
                                </span>
                                <span className="text-h2 text-ink decoration-[3px] underline-offset-[6px] group-hover:underline group-data-[status=active]:underline">
                                    {item.label()}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="container-page mt-auto flex flex-col gap-6 pt-10 pb-8">
                <ButtonLink variant="primary" to="/contact" onClick={onClose} className="w-full">
                    {m.cta_button()}
                </ButtonLink>
                <div className="flex items-center justify-between gap-4">
                    <LanguageSwitcher />
                </div>
                <ul className="flex gap-2">
                    {socialLinks.map((link) => (
                        <li key={link.label} className="flex flex-1">
                            <SocialChip href={link.href} label={link.label} icon={link.icon} className="flex-1" />
                        </li>
                    ))}
                </ul>
            </div>
        </dialog>
    )
}
