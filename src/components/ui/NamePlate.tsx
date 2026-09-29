import { cn } from '@/lib/utils'

interface NamePlateProps {
    /** Display name; defaults to the design's "JAN / DRLÝ". */
    name?: string
    /** Small mono lines next to the name (desktop / tablet only). */
    meta?: ReadonlyArray<string>
    /** Element for the name — use `h1` when the plate carries the page title. */
    as?: 'p' | 'h1' | 'h2'
    className?: string
}

/**
 * Name Plate — grain paper tab with a rounded top-left corner and top/left rules, overlapping the portrait.
 * 940×160 with 120px name on desktop → 346×64 with 50px name on mobile (390); below 390px the name keeps
 * scaling with the viewport (50px ≙ 12.82vw) so it still fits a 320px screen.
 */
export function NamePlate({ name = 'JAN / DRLÝ', meta = [], as: Name = 'p', className }: NamePlateProps) {
    return (
        <div
            className={cn(
                'bg-grain flex min-h-[clamp(4rem,9.1429vw+1.7714rem,10rem)] items-end lg:min-h-[clamp(6rem,min(9.1429vw+1.7714rem,14.8148svh),10rem)] gap-7 rounded-tl-[clamp(1.25rem,1.1429vw+0.9714rem,2rem)] border-t-[1.5px] border-l-[1.5px] border-line pr-4 pl-5 lg:px-10 lg:pt-[22px] lg:pb-1.5',
                className,
            )}
        >
            <Name className="font-display text-[clamp(2.25rem,min(12.8206vw,6.6667vw+1.5rem),7.5rem)] leading-[0.92] lg:text-[clamp(4rem,min(6.6667vw+1.5rem,11.1111svh),7.5rem)] font-black tracking-[-0.0417em] whitespace-nowrap text-ink">
                {name}
            </Name>
            {meta.length > 0 ? (
                <div className="hidden flex-col gap-1 pb-3.5 md:flex">
                    {meta.map((line) => (
                        <p
                            key={line}
                            className="font-mono text-[0.75rem] leading-[1.3] tracking-[0.0625rem] whitespace-nowrap text-ink-soft uppercase"
                        >
                            {line}
                        </p>
                    ))}
                </div>
            ) : null}
        </div>
    )
}
