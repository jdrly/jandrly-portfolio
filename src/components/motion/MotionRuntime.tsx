import { useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'

/**
 * Starts the client motion runtime (src/lib/motion/runtime.ts): Lenis, entrance and scroll-linked effects, hover
 * effects, hash scrolling. Renders nothing. The runtime and its libraries (Motion, Motion+, Lenis) load as a
 * separate chunk after hydration, so they stay off the critical path.
 */
export function MotionRuntime() {
    const router = useRouter()

    useEffect(() => {
        let stop: (() => void) | undefined
        let cancelled = false
        // If the chunk fails to load, the site simply stays static (everything is visible by default).
        import('@/lib/motion/runtime')
            .then(({ startMotionRuntime }) => {
                if (!cancelled) stop = startMotionRuntime(router)
            })
            .catch(() => undefined)
        return () => {
            cancelled = true
            stop?.()
        }
    }, [router])

    return null
}
