import { describe, expect, it } from 'vitest'
import { CONTACT_FIELD_LIMITS, createContactFieldSchemas } from './rules'
import { contactSubmissionSchema } from './schema'
import type { ContactFieldMessages } from './rules'

const MESSAGES: ContactFieldMessages = {
    nameTooShort: () => 'name-too-short',
    emailInvalid: () => 'email-invalid',
    phoneInvalid: () => 'phone-invalid',
    messageTooShort: () => 'message-too-short',
    tooLong: (max) => `too-long:${max}`,
    invalid: () => 'invalid',
}

const client = createContactFieldSchemas(MESSAGES)

function clientErrors(field: keyof typeof client, value: string) {
    const result = client[field].safeParse(value)
    return result.success ? [] : result.error.issues.map((issue) => issue.message)
}

const VALID = {
    name: 'Jan Novák',
    email: 'jan.novak@seznam.cz',
    phone: '+420 777 123 456',
    message: 'Ahoj, mám zájem o web, zavolejte mi.',
    formToken: 'token',
    turnstileToken: 'turnstile',
}

function serverAccepts(field: keyof typeof client, value: string) {
    return contactSubmissionSchema.safeParse({ ...VALID, [field]: value }).success
}

describe('contact field rules', () => {
    it.each([
        ['phone', '(+420) 777 123 456'],
        ['phone', '777/123.456'],
        ['phone', ''],
        ['name', '  Jan  '],
        ['email', ' jan@example.com '],
    ] as const)('accepts %s %j on both sides', (field, value) => {
        expect(clientErrors(field, value)).toEqual([])
        expect(serverAccepts(field, value)).toBe(true)
    })

    it.each([
        ['name', ' a ', 'name-too-short'],
        ['name', 'x'.repeat(CONTACT_FIELD_LIMITS.name.max + 1), `too-long:${CONTACT_FIELD_LIMITS.name.max}`],
        ['name', 'Jan\nNovák', 'invalid'],
        ['email', 'not-an-email', 'email-invalid'],
        ['phone', 'call me maybe', 'phone-invalid'],
        ['phone', '1'.repeat(CONTACT_FIELD_LIMITS.phone.max + 1), `too-long:${CONTACT_FIELD_LIMITS.phone.max}`],
        ['message', ' '.repeat(12), 'message-too-short'],
        ['message', 'x'.repeat(CONTACT_FIELD_LIMITS.message.max + 1), `too-long:${CONTACT_FIELD_LIMITS.message.max}`],
    ] as const)('rejects %s %#: with a localized message, and so does the server', (field, value, message) => {
        expect(clientErrors(field, value)).toContain(message)
        expect(serverAccepts(field, value)).toBe(false)
    })

    it('uses zod defaults without messages (server side)', () => {
        const server = createContactFieldSchemas()
        const result = server.name.safeParse('x')

        expect(result.success).toBe(false)
        expect(result.error?.issues[0].message).not.toBe('name-too-short')
    })
})
