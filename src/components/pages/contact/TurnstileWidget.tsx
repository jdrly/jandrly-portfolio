import { useEffect, useRef } from 'react'

const TURNSTILE_SCRIPT_ID = 'cloudflare-turnstile-script'
const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

type TurnstileWidgetId = string

interface TurnstileRenderOptions {
    sitekey: string
    action: string
    appearance: 'interaction-only'
    size: 'flexible'
    theme: 'dark'
    callback: (token: string) => void
    'error-callback': () => void
    'expired-callback': () => void
}

interface TurnstileApi {
    render: (container: HTMLElement, options: TurnstileRenderOptions) => TurnstileWidgetId
    remove: (widgetId: TurnstileWidgetId) => void
    reset: (widgetId: TurnstileWidgetId) => void
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

interface TurnstileWidgetProps {
    siteKey: string
    resetSignal: number
    onTokenChange: (token: string) => void
}

export function TurnstileWidget({ siteKey, resetSignal, onTokenChange }: TurnstileWidgetProps) {
    const containerRef = useRef<HTMLDivElement>(null)
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
                    action: 'contact',
                    appearance: 'interaction-only',
                    size: 'flexible',
                    theme: 'dark',
                    callback: (token) => onTokenChangeRef.current(token),
                    'error-callback': () => onTokenChangeRef.current(''),
                    'expired-callback': () => onTokenChangeRef.current(''),
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
        }
    }, [siteKey])

    useEffect(() => {
        if (resetSignal > 0 && widgetIdRef.current && window.turnstile) {
            window.turnstile.reset(widgetIdRef.current)
        }
    }, [resetSignal])

    return <div ref={containerRef} className="min-h-[65px] w-full" />
}
