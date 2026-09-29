/** Bar widths (px, as drawn in the design) for the reusable barcode and the case-card variants. */
export const BARCODE_PATTERNS = {
    default: [12, 3, 14, 3, 3, 5, 2, 4, 3, 2, 72, 6],
    case1: [8, 2, 3, 10, 2, 2, 40, 4],
    case2: [3, 3, 12, 2, 6, 2, 2, 30],
    case3: [14, 2, 2, 4, 2, 8, 24, 2],
} as const satisfies Record<string, ReadonlyArray<number>>
