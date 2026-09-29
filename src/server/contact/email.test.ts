// @vitest-environment node
import { Effect, Layer, Option, Redacted } from 'effect'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ContactConfig } from './config'
import { Mailer, buildEmailHtml } from './email'
import { ContactLog } from './log'
import { buildEmailSubject } from './schema'
import type { LogEntry } from './log'

const MESSAGE = {
    name: 'Jan Novák',
    email: 'jan@example.com',
    phone: '',
    message: 'Hello <script>alert(1)</script>',
    nonce: 'AAAAAAAAAAAAAAAAAAAAAA',
}

afterEach(() => {
    vi.restoreAllMocks()
})

describe('email building', () => {
    it('produces a single-line, bounded subject', () => {
        expect(buildEmailSubject('Jan\r\nBcc: x@example.com')).toBe('New portfolio contact request from Jan Bcc: x@example.com')
        expect(buildEmailSubject('x'.repeat(200)).length).toBeLessThan(100)
    })

    it('escapes HTML', () => {
        expect(buildEmailHtml(MESSAGE)).toContain('Hello &lt;script&gt;alert(1)&lt;/script&gt;')
    })
})

describe('Mailer dry run', () => {
    it('logs a redacted summary instead of sending', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch')
        const entries: Array<LogEntry> = []
        const layer = Mailer.layer.pipe(
            Layer.provide(ContactConfig.layerTest({ dryRun: true, resendApiKey: Option.some(Redacted.make('re_x')) })),
            Layer.provide(ContactLog.layerMemory(entries)),
        )

        await Effect.runPromise(Mailer.use((mailer) => mailer.send(MESSAGE)).pipe(Effect.provide(layer)))

        expect(fetchMock).not.toHaveBeenCalled()
        expect(entries).toEqual([
            {
                level: 'info',
                fields: expect.objectContaining({
                    event: 'contact_dry_run',
                    emailDomain: 'example.com',
                    messageChars: MESSAGE.message.length,
                }),
            },
        ])
        const line = JSON.stringify(entries)
        expect(line).not.toContain('jan@example.com')
        expect(line).not.toContain('Hello')
    })
})
