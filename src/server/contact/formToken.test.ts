// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { createFormToken, verifyFormToken } from './formToken'
import { FORM_TOKEN_MAX_AGE_MS, FORM_TOKEN_MIN_AGE_MS } from './rules'

const SECRET = 'test-secret-0123456789abcdef'
const NOW = 1_800_000_000_000

describe('form token', () => {
    it('accepts a valid token after the minimum age', () => {
        const { token, nonce } = createFormToken(SECRET, NOW - 10_000)

        expect(verifyFormToken(token, SECRET, NOW)).toEqual({ ok: true, nonce, issuedAt: NOW - 10_000 })
    })

    it('rejects tokens used too fast', () => {
        const { token } = createFormToken(SECRET, NOW - (FORM_TOKEN_MIN_AGE_MS - 1))

        expect(verifyFormToken(token, SECRET, NOW)).toEqual({ ok: false, reason: 'too_fast' })
    })

    it('rejects expired tokens', () => {
        const { token } = createFormToken(SECRET, NOW - FORM_TOKEN_MAX_AGE_MS - 1)

        expect(verifyFormToken(token, SECRET, NOW)).toEqual({ ok: false, reason: 'expired' })
    })

    it('rejects tokens issued in the future', () => {
        const { token } = createFormToken(SECRET, NOW + 60_000)

        expect(verifyFormToken(token, SECRET, NOW)).toEqual({ ok: false, reason: 'issued_in_future' })
    })

    it('rejects forged or tampered tokens', () => {
        const { token } = createFormToken(SECRET, NOW - 10_000)
        const [, nonce, signature] = token.split('.')
        const backdated = `${NOW - 60_000}.${nonce}.${signature}`

        expect(verifyFormToken(token, 'another-secret', NOW)).toEqual({ ok: false, reason: 'bad_signature' })
        expect(verifyFormToken(backdated, SECRET, NOW)).toEqual({ ok: false, reason: 'bad_signature' })
        expect(verifyFormToken(createFormToken('attacker-secret', NOW - 10_000).token, SECRET, NOW)).toEqual({
            ok: false,
            reason: 'bad_signature',
        })
    })

    it('rejects malformed tokens', () => {
        for (const token of ['', 'abc', `${NOW}`, `${NOW}.nonce.sig`, `${Date.now()}`, 'x'.repeat(200)]) {
            expect(verifyFormToken(token, SECRET, NOW)).toEqual({ ok: false, reason: 'malformed' })
        }
    })

    it('does not depend on the client clock: the timestamp is signed server time', () => {
        // The old implementation trusted a client-supplied `formStartedAt`; a visitor
        // with a fast clock produced a negative duration and was silently dropped.
        const { token } = createFormToken(SECRET, NOW - 5_000)

        expect(verifyFormToken(token, SECRET, NOW).ok).toBe(true)
    })
})
