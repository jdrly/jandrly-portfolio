import { describe, expect, it } from 'vitest'
import { identityTransform } from './env'

describe('identityTransform', () => {
    it('keeps functions and units, zeroes translations and rotations, and sets scales to 1', () => {
        expect(identityTransform('translateY(112%) rotate(5deg)')).toBe('translateY(0%) rotate(0deg)')
        expect(identityTransform('translateY(96px) rotate(-2.5deg) scale(0.95)')).toBe('translateY(0px) rotate(0deg) scale(1)')
        expect(identityTransform('scale(1.22)')).toBe('scale(1)')
        expect(identityTransform('translate(-4px, 12px)')).toBe('translate(0px, 0px)')
    })

    it('keeps perspective, which is not an offset', () => {
        expect(identityTransform('perspective(900px) rotateX(-92deg)')).toBe('perspective(900px) rotateX(0deg)')
    })
})
