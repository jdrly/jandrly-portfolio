import { Link } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'dark' | 'submit'
type ButtonSize = 'md' | 'sm'

interface ButtonStyleProps {
    variant?: ButtonVariant
    /** `sm` only applies to `dark` (the header CTA). */
    size?: ButtonSize
    /** Show the arrow-up-right icon (default true). */
    withIcon?: boolean
    /** Extra classes for the arrow icon, e.g. a size override (`size-5 lg:size-[18px]`). */
    iconClassName?: string
    className?: string
    children: ReactNode
}

/*
 * Hover / press feedback is gated behind `interactive:` (not `:disabled`, not `aria-disabled="true"`), so a
 * disabled button — or a link marked `aria-disabled` — neither changes color nor shifts.
 */
const BASE_CLASS =
    'group/button inline-flex shrink-0 cursor-pointer items-center font-mono uppercase transition-[background-color,color,translate] duration-200 ease-out-soft select-none interactive:active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:cursor-not-allowed aria-disabled:opacity-60'

const VARIANT_CLASS: Record<ButtonVariant, string> = {
    // Button / Primary: 360×68, coral, 16px label. Mobile: 15px, 20/22 padding, 16px radius.
    primary:
        'w-[22.5rem] max-w-full justify-between gap-4 rounded-tl-2xl rounded-br-2xl bg-coral px-[22px] py-5 text-button text-ink interactive:hover:bg-ink interactive:hover:text-paper lg:rounded-tl-[18px] lg:rounded-br-[18px] lg:px-7 lg:py-[22px]',
    // Button / Dark: ink, 14px label, coral arrow.
    dark: 'justify-center gap-3 rounded-tl-[14px] rounded-br-[14px] bg-ink px-6 py-4 text-[0.875rem] leading-normal font-bold tracking-[0.0625rem] text-paper interactive:hover:bg-teal-ink',
    // Button / Submit: full-width coral bar. 15px label on desktop → 14px on mobile.
    submit: 'w-full justify-between gap-4 rounded-tl-[14px] rounded-br-[14px] bg-coral px-5 py-[18px] text-[0.875rem] leading-[1.3] font-bold tracking-[0.075rem] text-ink interactive:hover:bg-ink interactive:hover:text-paper lg:px-6 lg:py-5 lg:text-[0.9375rem] lg:tracking-[0.0875rem]',
}

const DARK_SMALL_CLASS = 'gap-2.5 rounded-tl-xl rounded-br-xl px-5 py-3.5 text-label leading-[1.3]'

const ICON_BASE_CLASS =
    'shrink-0 transition-[translate,color] duration-200 ease-out-soft group-interactive/button:group-hover/button:translate-x-0.5 group-interactive/button:group-hover/button:-translate-y-0.5'

const ICON_CLASS: Record<ButtonVariant, string> = {
    primary: 'size-[22px] lg:size-6 group-interactive/button:group-hover/button:text-coral',
    dark: 'size-[18px] text-coral group-interactive/button:group-hover/button:text-on-dark-label',
    submit: 'size-5 lg:size-[22px] group-interactive/button:group-hover/button:text-coral',
}

function buttonClassName({ variant = 'primary', size = 'md', className }: Pick<ButtonStyleProps, 'variant' | 'size' | 'className'>) {
    return cn(BASE_CLASS, VARIANT_CLASS[variant], variant === 'dark' && size === 'sm' ? DARK_SMALL_CLASS : null, className)
}

function ButtonContent({
    variant = 'primary',
    size = 'md',
    withIcon = true,
    iconClassName,
    children,
}: Omit<ButtonStyleProps, 'className'>) {
    return (
        <>
            <span data-scramble-hover="" data-magnetic-inner="">
                {children}
            </span>
            {withIcon ? (
                <ArrowUpRight
                    aria-hidden="true"
                    className={cn(
                        ICON_BASE_CLASS,
                        ICON_CLASS[variant],
                        variant === 'dark' && size === 'sm' ? 'size-4' : null,
                        iconClassName,
                    )}
                />
            ) : null}
        </>
    )
}

type ButtonProps = ButtonStyleProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'>

/** Native `<button>` in one of the design's button styles. Defaults to `type="button"`. */
export function Button({ variant, size, withIcon, iconClassName, className, children, type = 'button', ...props }: ButtonProps) {
    return (
        <button type={type} data-magnetic="" className={buttonClassName({ variant, size, className })} {...props}>
            <ButtonContent variant={variant} size={size} withIcon={withIcon} iconClassName={iconClassName}>
                {children}
            </ButtonContent>
        </button>
    )
}

type ButtonLinkProps = ButtonStyleProps &
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children' | 'className' | 'href'> &
    ({ to: string; href?: never } | { href: string; to?: never })

/**
 * Link styled as a button. `to` renders a router `Link` (pass a localized path), `href` a plain anchor
 * (mailto:, external). `aria-disabled="true"` renders the disabled look without hover feedback.
 */
export function ButtonLink({ variant, size, withIcon, iconClassName, className, children, to, href, ...props }: ButtonLinkProps) {
    const classes = buttonClassName({ variant, size, className })
    const content = (
        <ButtonContent variant={variant} size={size} withIcon={withIcon} iconClassName={iconClassName}>
            {children}
        </ButtonContent>
    )

    return to !== undefined ? (
        <Link to={to} data-magnetic="" className={classes} {...props}>
            {content}
        </Link>
    ) : (
        <a href={href} data-magnetic="" className={classes} {...props}>
            {content}
        </a>
    )
}
