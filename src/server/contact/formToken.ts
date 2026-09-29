import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { FORM_TOKEN_MAX_AGE_MS, FORM_TOKEN_MIN_AGE_MS } from './rules'

/**
 * Signed, server-timed form token: `${issuedAt}.${nonce}.${signature}`.
 *
 * `issuedAt` is the server clock at issue time and the HMAC stops anyone from
 * forging or back-dating it, so the "filled too fast" / "too old" checks never
 * depend on the visitor's clock. The nonce doubles as Turnstile `cData`,
 * binding the Turnstile token to this particular form token.
 */

/** Tolerated forward skew between serverless instances. */
const MAX_FUTURE_SKEW_MS = 5_000

const TOKEN_PATTERN = /^(\d{13})\.([A-Za-z0-9_-]{22})\.([A-Za-z0-9_-]{43})$/

type FormTokenFailure = 'malformed' | 'bad_signature' | 'too_fast' | 'expired' | 'issued_in_future'

export type FormTokenVerification = { ok: true; nonce: string; issuedAt: number } | { ok: false; reason: FormTokenFailure }

function generateNonce() {
    return randomBytes(16).toString('base64url')
}

function sign(secret: string, payload: string) {
    return createHmac('sha256', secret).update(payload).digest('base64url')
}

export function createFormToken(secret: string, issuedAt: number, nonce: string = generateNonce()) {
    const payload = `${issuedAt}.${nonce}`

    return { token: `${payload}.${sign(secret, payload)}`, nonce }
}

export function verifyFormToken(token: string, secret: string, now: number): FormTokenVerification {
    const match = TOKEN_PATTERN.exec(token)

    if (!match) {
        return { ok: false, reason: 'malformed' }
    }

    const [, issuedAtRaw, nonce, signature] = match
    const expected = Buffer.from(sign(secret, `${issuedAtRaw}.${nonce}`))
    const received = Buffer.from(signature)

    if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
        return { ok: false, reason: 'bad_signature' }
    }

    const issuedAt = Number(issuedAtRaw)
    const age = now - issuedAt

    if (age < -MAX_FUTURE_SKEW_MS) {
        return { ok: false, reason: 'issued_in_future' }
    }

    if (age < FORM_TOKEN_MIN_AGE_MS) {
        return { ok: false, reason: 'too_fast' }
    }

    if (age > FORM_TOKEN_MAX_AGE_MS) {
        return { ok: false, reason: 'expired' }
    }

    return { ok: true, nonce, issuedAt }
}
