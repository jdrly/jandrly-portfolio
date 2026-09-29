import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { TURNSTILE_ACTION } from '@/server/contact/rules'

const TURNSTILE_SCRIPT_ID = 'cloudflare-turnstile-script'
const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

type TurnstileWidgetId = string

interface TurnstileRenderOptions {
    sitekey: string
    action: string
    cData?: string
    appearance: 'interaction-only'
    size: 'flexible'
    theme: 'dark'
    callback: (token: string) => void
    'error-callback': () => void
    'expired-callback': () => void
    /** Interaction-only mode: the widget is about to show a challenge the visitor has to solve. */
    'before-interactive-callback': () => void
    /** Interaction-only mode: the visible challenge was solved and the widget hides again. */
    'after-interactive-callback': () => void
}

interface TurnstileApi {
    render: (container: HTMLElement, options: TurnstileRenderOptions) => TurnstileWidgetId
    remove: (widgetId: TurnstileWidgetId) => void
}

declare global {
    interface Window {
        turnstile?: TurnstileApi
    }
}

let turnstileLoader: Promise<TurnstileApi> | undefined

function loadTurnstile() {
    if (window.turnstile) {
        return Promise.resolve(window.turnstile)
    }

    if (turnstileLoader) {
        return turnstileLoader
    }

    turnstileLoader = new Promise<TurnstileApi>((resolve, reject) => {
        const handleLoad = () => {
            if (window.turnstile) {
                resolve(window.turnstile)
                return
            }

            reject(new Error('Turnstile API did not initialize'))
        }
        const handleError = () => reject(new Error('Turnstile script failed to load'))
        const existingScript = document.getElementById(TURNSTILE_SCRIPT_ID)

        if (existingScript) {
            existingScript.addEventListener('load', handleLoad, { once: true })
            existingScript.addEventListener('error', handleError, { once: true })
            return
        }

        const script = document.createElement('script')
        script.id = TURNSTILE_SCRIPT_ID
        script.src = TURNSTILE_SCRIPT_URL
        script.defer = true
        script.addEventListener('load', handleLoad, { once: true })
        script.addEventListener('error', handleError, { once: true })
        document.head.append(script)
    })

    return turnstileLoader
}

export interface TurnstileWidgetProps {
    siteKey: string
    /** Bound into the token and checked on the server (the form token nonce). Changing it re-renders the widget. */
    cData?: string
    onTokenChange: (token: string) => void
}

/**
 * Cloudflare Turnstile in "interaction-only" mode: invisible for most visitors, a visible challenge only when
 * Cloudflare asks for one. While invisible the container is taken out of the flow (it takes no space and no
 * flex gap); it joins the layout only while a challenge (or a Turnstile error) is shown.
 *
 * Every mount produces one token. To get a fresh one, remount the widget with a new React `key`.
 */
export function TurnstileWidget({ siteKey, cData, onTokenChange }: TurnstileWidgetProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [isShown, setIsShown] = useState(false)
    const widgetIdRef = useRef<TurnstileWidgetId>(null)
    const onTokenChangeRef = useRef(onTokenChange)

    useEffect(() => {
        onTokenChangeRef.current = onTokenChange
    }, [onTokenChange])

    useEffect(() => {
        if (!siteKey || !containerRef.current) {
            return
        }

        let cancelled = false

        void loadTurnstile()
            .then((turnstile) => {
                if (cancelled || !containerRef.current) {
                    return
                }

                widgetIdRef.current = turnstile.render(containerRef.current, {
                    sitekey: siteKey,
                    action: TURNSTILE_ACTION,
                    ...(cData ? { cData } : {}),
                    appearance: 'interaction-only',
                    size: 'flexible',
                    theme: 'dark',
                    callback: (token) => onTokenChangeRef.current(token),
                    'error-callback': () => {
                        onTokenChangeRef.current('')
                        setIsShown(true)
                    },
                    'expired-callback': () => onTokenChangeRef.current(''),
                    'before-interactive-callback': () => setIsShown(true),
                    'after-interactive-callback': () => setIsShown(false),
                })
            })
            .catch((error: unknown) => {
                console.error('Turnstile failed to initialize', error)
                onTokenChangeRef.current('')
            })

        return () => {
            cancelled = true

            if (widgetIdRef.current && window.turnstile) {
                window.turnstile.remove(widgetIdRef.current)
                widgetIdRef.current = null
            }

            setIsShown(false)
            onTokenChangeRef.current('')
        }
    }, [siteKey, cData])

    return <div ref={containerRef} className={cn('w-full', isShown ? null : 'pointer-events-none absolute size-px overflow-hidden')} />
}
