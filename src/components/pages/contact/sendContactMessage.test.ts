import { afterEach, describe, expect, it, vi } from 'vitest'

import { contactMessageSchema, isLikelyBotSubmission, verifyTurnstileToken } from './sendContactMessage'

afterEach(() => {
    vi.restoreAllMocks()
})

describe('contactMessageSchema', () => {
    it('rejects direct bot submissions without proof of browser verification', () => {
        const spamPayload = {
            name: 'CiaDXxqkparbHyyth',
            email: 'ma.huz.e.wo.y.on0.8@gmail.com',
            phone: '2185848960',
            message: 'XHkXxGvjFZkZzlYmvX',
            botcheck: '',
        }

        expect(contactMessageSchema.safeParse(spamPayload).success).toBe(false)
    })

    it('accepts a complete browser submission payload', () => {
        expect(
            contactMessageSchema.safeParse({
                name: 'Jane Doe',
                email: 'jane@example.com',
                phone: '',
                message: 'I would like to discuss a project.',
                website: '',
                formStartedAt: Date.now() - 10_000,
                turnstileToken: 'verified-token',
            }).success,
        ).toBe(true)
    })
})

describe('isLikelyBotSubmission', () => {
    const now = 1_000_000

    it('flags a filled honeypot', () => {
        expect(isLikelyBotSubmission({ website: 'https://spam.example', formStartedAt: now - 10_000 }, now)).toBe(true)
    })

    it('flags submissions completed too quickly', () => {
        expect(isLikelyBotSubmission({ website: '', formStartedAt: now - 500 }, now)).toBe(true)
    })

    it('allows a normally completed form', () => {
        expect(isLikelyBotSubmission({ website: '', formStartedAt: now - 10_000 }, now)).toBe(false)
    })
})

describe('verifyTurnstileToken', () => {
    it('accepts a successful contact challenge', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(JSON.stringify({ success: true, action: 'contact' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }),
        )

        await expect(verifyTurnstileToken('valid-token', 'secret')).resolves.toBe(true)
    })

    it('rejects failed or cross-action challenges', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch')

        fetchMock.mockResolvedValueOnce(
            new Response(JSON.stringify({ success: false, action: 'contact' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }),
        )
        fetchMock.mockResolvedValueOnce(
            new Response(JSON.stringify({ success: true, action: 'newsletter' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }),
        )

        await expect(verifyTurnstileToken('invalid-token', 'secret')).resolves.toBe(false)
        await expect(verifyTurnstileToken('wrong-action-token', 'secret')).resolves.toBe(false)
    })
})
