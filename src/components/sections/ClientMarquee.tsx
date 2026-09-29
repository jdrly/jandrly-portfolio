import { Ticker } from 'motion-plus/react'
import { CLIENT_GROUPS } from '@/components/sections/clientNames'
import { STAR_PATH } from '@/components/ui/Sparkles'
import * as m from '@/paraglide/messages'

const NAMES = CLIENT_GROUPS.flat()

/**
 * Client names as an endless Motion+ Ticker (full bleed, edge fade, slows right down on hover). Loaded lazily and
 * mounted only after hydration, off screen, and never under reduced motion (see HomeWorkSection). The moving copy
 * is aria-hidden; assistive tech reads the plain list.
 */
export default function ClientMarquee() {
    return (
        <>
            <ul aria-label={m.work_clients_label()} className="sr-only">
                {NAMES.map((name) => (
                    <li key={name}>{name}</li>
                ))}
            </ul>
            <div aria-hidden="true" className="-mx-gutter">
                <Ticker
                    velocity={48}
                    hoverFactor={0.25}
                    gap={0}
                    fade={96}
                    items={NAMES.map((name) => (
                        <span key={name} className="flex items-center gap-[clamp(1.25rem,2vw,2.5rem)] pr-[clamp(1.25rem,2vw,2.5rem)]">
                            <span className="font-display text-[clamp(2.25rem,3.4vw+1rem,4.5rem)] leading-[1.1] font-extrabold tracking-[-0.03em] whitespace-nowrap text-paper">
                                {name}
                            </span>
                            <svg
                                viewBox="0 0 100 100"
                                className="size-[clamp(1rem,1.4vw,1.75rem)] shrink-0 fill-on-dark-label"
                                focusable="false"
                            >
                                <path d={STAR_PATH} />
                            </svg>
                        </span>
                    ))}
                />
            </div>
        </>
    )
}
