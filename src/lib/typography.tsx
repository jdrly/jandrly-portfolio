import type { ReactNode } from 'react'

/** A word with inner hyphens ("e-mail", "e-mailové", "full-stack"). Captured, so `split` keeps it. */
const HYPHENATED_WORD = /(\p{L}+(?:-\p{L}+)+)/u

/**
 * Keeps hyphenated words on one line. Czech typography does not break a line at a hyphen ("e-" / "mail"), but
 * browsers do. The text itself stays unchanged (no U+2011), so find in page and copy and paste still work.
 */
export function keepHyphenatedWords(text: string): ReactNode {
    const parts = text.split(HYPHENATED_WORD)
    if (parts.length === 1) {
        return text
    }

    // Odd indexes hold the captured words. The parts never reorder; the key pairs position and word to stay unique.
    return parts.map((part, index) =>
        index % 2 === 1 ? (
            <span key={`${index}:${part}`} className="whitespace-nowrap">
                {part}
            </span>
        ) : (
            part
        ),
    )
}
