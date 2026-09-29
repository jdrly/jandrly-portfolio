// @vitest-environment node
import { Effect } from 'effect'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ContactLog, fingerprint } from './log'
import type { ContactEvent } from './log'

afterEach(() => {
    vi.restoreAllMocks()
})

function record(event: ContactEvent) {
    return Effect.runPromise(ContactLog.use((log) => log.record(event)).pipe(Effect.provide(ContactLog.layer)))
}

describe('ContactLog', () => {
    it('writes one redacted JSON line per event at the event level', async () => {
        const info = vi.spyOn(console, 'info').mockImplementation(() => {})
        const error = vi.spyOn(console, 'error').mockImplementation(() => {})

        await record({ event: 'contact_form', outcome: 'sent', ip: '192.0.2.1', email: 'Jan@Example.com' })
        await record({ event: 'contact_rate_limit_error', error: new TypeError('Redis says no to jan@example.com') })

        expect(JSON.parse(String(info.mock.calls[0][0]))).toEqual({
            event: 'contact_form',
            outcome: 'sent',
            ip: '192.0.2.1',
            emailHash: fingerprint('jan@example.com'),
            emailDomain: 'example.com',
        })
        expect(JSON.parse(String(error.mock.calls[0][0]))).toEqual({
            event: 'contact_rate_limit_error',
            error: { name: 'TypeError', message: 'Redis says no to [email]' },
        })
    })

    it('never writes a plain address, even for non-Error values', async () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {})

        await record({ event: 'contact_botid_error', error: 'failed for jan@example.com' })

        expect(String(error.mock.calls[0][0])).not.toContain('jan@example.com')
    })
})
