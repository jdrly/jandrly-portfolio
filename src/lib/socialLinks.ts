import { SITE } from './site'

/**
 * Outline brand icons in Lucide's style (24×24, 2px round strokes) — the design uses Lucide's
 * facebook/linkedin/github icons, which lucide-react v1 no longer ships.
 */
type BrandIconShape =
    | { kind: 'path'; d: string }
    | { kind: 'rect'; x: number; y: number; width: number; height: number }
    | { kind: 'circle'; cx: number; cy: number; r: number }

interface BrandIconData {
    title: string
    shapes: ReadonlyArray<BrandIconShape>
}

const facebookIcon: BrandIconData = {
    title: 'Facebook',
    shapes: [{ kind: 'path', d: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z' }],
}

const linkedinIcon: BrandIconData = {
    title: 'LinkedIn',
    shapes: [
        { kind: 'path', d: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z' },
        { kind: 'rect', x: 2, y: 9, width: 4, height: 12 },
        { kind: 'circle', cx: 4, cy: 4, r: 2 },
    ],
}

const githubIcon: BrandIconData = {
    title: 'GitHub',
    shapes: [
        {
            kind: 'path',
            d: 'M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4',
        },
        { kind: 'path', d: 'M9 18c-4.51 2-5-2-7-2' },
    ],
}

export type { BrandIconData, BrandIconShape }

export const socialLinks = [
    { label: 'Facebook', href: SITE.socials.facebook, icon: facebookIcon },
    { label: 'LinkedIn', href: SITE.socials.linkedin, icon: linkedinIcon },
    { label: 'GitHub', href: SITE.socials.github, icon: githubIcon },
]
