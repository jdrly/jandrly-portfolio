import { m as motion } from 'framer-motion'
import type { HTMLMotionProps, Variants } from 'framer-motion'
import type { ReactNode } from 'react'

// Shared easing for smooth, professional animations
const smoothEase = [0.22, 1, 0.36, 1] as const

// Default viewport settings for scroll-triggered animations
// Use amount: 0 to trigger as soon as any part is visible (fixes above-the-fold content)
const defaultViewport = { once: true, amount: 0 as const }

// ============================================================================
// Animation Variants
// ============================================================================

const staggerItemVariants: Variants = {
    hidden: {
        opacity: 0,
        y: 20,
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: smoothEase,
        },
    },
}

// ============================================================================
// FadeIn Component
// ============================================================================
interface FadeInProps extends Omit<HTMLMotionProps<'div'>, 'variants'> {
    children: ReactNode
    direction?: 'up' | 'down' | 'left' | 'right' | 'none'
    delay?: number
    duration?: number
    className?: string
}

const fadeDirectionOffsets = {
    up: { y: 30 },
    down: { y: -30 },
    left: { x: 30 },
    right: { x: -30 },
    none: {},
} as const

function FadeIn({ children, direction = 'up', delay = 0, duration = 0.6, className, ...props }: FadeInProps) {
    const variants: Variants = {
        hidden: {
            opacity: 0,
            ...fadeDirectionOffsets[direction],
        },
        visible: {
            opacity: 1,
            x: 0,
            y: 0,
            transition: {
                duration,
                delay,
                ease: smoothEase,
            },
        },
    }

    return (
        <motion.div initial="hidden" whileInView="visible" viewport={defaultViewport} variants={variants} className={className} {...props}>
            {children}
        </motion.div>
    )
}

// ============================================================================
// StaggerContainer Component
// ============================================================================
interface StaggerContainerProps extends Omit<HTMLMotionProps<'div'>, 'variants'> {
    children: ReactNode
    staggerDelay?: number
    delayChildren?: number
    className?: string
}

function StaggerContainer({ children, staggerDelay = 0.1, delayChildren = 0, className, ...props }: StaggerContainerProps) {
    const variants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: staggerDelay,
                delayChildren,
            },
        },
    }

    return (
        <motion.div initial="hidden" whileInView="visible" viewport={defaultViewport} variants={variants} className={className} {...props}>
            {children}
        </motion.div>
    )
}

// ============================================================================
// StaggerItem Component
// ============================================================================
interface StaggerItemProps extends Omit<HTMLMotionProps<'div'>, 'variants'> {
    children: ReactNode
    className?: string
}

function StaggerItem({ children, className, ...props }: StaggerItemProps) {
    return (
        <motion.div variants={staggerItemVariants} className={className} {...props}>
            {children}
        </motion.div>
    )
}

// ============================================================================
// ScaleOnHover Component
// ============================================================================
interface ScaleOnHoverProps extends Omit<HTMLMotionProps<'div'>, 'whileHover' | 'whileTap'> {
    children: ReactNode
    scale?: number
    tapScale?: number
    className?: string
}

function ScaleOnHover({ children, scale = 1.02, tapScale = 0.98, className, ...props }: ScaleOnHoverProps) {
    return (
        <motion.div
            whileHover={{ scale }}
            whileTap={{ scale: tapScale }}
            transition={{ duration: 0.2, ease: smoothEase }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    )
}

// ============================================================================
// SlideIn Component
// ============================================================================
interface SlideInProps extends Omit<HTMLMotionProps<'div'>, 'variants'> {
    children: ReactNode
    direction?: 'left' | 'right' | 'up' | 'down'
    delay?: number
    duration?: number
    distance?: number
    className?: string
}

function SlideIn({ children, direction = 'left', delay = 0, duration = 0.6, distance = 50, className, ...props }: SlideInProps) {
    const directionOffset = {
        left: { x: -distance },
        right: { x: distance },
        up: { y: distance },
        down: { y: -distance },
    }

    const variants: Variants = {
        hidden: {
            opacity: 0,
            ...directionOffset[direction],
        },
        visible: {
            opacity: 1,
            x: 0,
            y: 0,
            transition: {
                duration,
                delay,
                ease: smoothEase,
            },
        },
    }

    return (
        <motion.div initial="hidden" whileInView="visible" viewport={defaultViewport} variants={variants} className={className} {...props}>
            {children}
        </motion.div>
    )
}

// ============================================================================
// PageTransition Component (wraps page content with enter animation)
// ============================================================================
interface PageTransitionProps extends Omit<HTMLMotionProps<'div'>, 'initial' | 'animate'> {
    children: ReactNode
    className?: string
}

function PageTransition({ children, className, ...props }: PageTransitionProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: smoothEase }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    )
}

// ============================================================================
// Exports
// ============================================================================
export { FadeIn, StaggerContainer, StaggerItem, ScaleOnHover, SlideIn, PageTransition, smoothEase, defaultViewport }
