import { Context, Effect, Layer, Redacted } from 'effect'
import { ContactConfig } from './config'
import { SendFailed } from './errors'
import { ContactLog } from './log'
import { buildEmailSubject } from './schema'
import type { ConfigurationError } from './errors'

export interface OutgoingContactMessage {
    name: string
    email: string
    phone: string
    message: string
    /** Form token nonce, used as the Resend idempotency key so a replayed token cannot send twice. */
    nonce: string
}

function escapeHtml(value: string) {
    return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;')
}

function buildEmailText(data: OutgoingContactMessage) {
    return [`Name: ${data.name}`, `Email: ${data.email}`, `Phone: ${data.phone || 'Not provided'}`, '', 'Message:', data.message].join('\n')
}

export function buildEmailHtml(data: OutgoingContactMessage) {
    const fields = [
        ['Name', data.name],
        ['Email', data.email],
        ['Phone', data.phone || 'Not provided'],
    ]

    return `
        <h2>New portfolio contact request</h2>
        <table cellpadding="6" cellspacing="0" style="border-collapse: collapse;">
            <tbody>
                ${fields
                    .map(
                        ([label, value]) => `
                            <tr>
                                <th align="left" style="color: #555;">${escapeHtml(label)}</th>
                                <td>${escapeHtml(value)}</td>
                            </tr>
                        `,
                    )
                    .join('')}
            </tbody>
        </table>
        <h3>Message</h3>
        <p style="white-space: pre-wrap;">${escapeHtml(data.message)}</p>
    `
}

export class Mailer extends Context.Service<
    Mailer,
    {
        send: (message: OutgoingContactMessage) => Effect.Effect<void, SendFailed | ConfigurationError>
    }
>()('jandrly/server/contact/Mailer') {
    static readonly layer = Layer.effect(
        Mailer,
        Effect.gen(function* () {
            const config = yield* ContactConfig
            const log = yield* ContactLog

            const send = Effect.fn('Mailer.send')(function* (message: OutgoingContactMessage) {
                const delivery = yield* config.delivery

                if (delivery._tag === 'DryRun') {
                    return yield* log.record({
                        event: 'contact_dry_run',
                        email: message.email,
                        nameChars: message.name.length,
                        messageChars: message.message.length,
                        hasPhone: message.phone.length > 0,
                        subjectChars: buildEmailSubject(message.name).length,
                    })
                }

                const apiKey = Redacted.value(delivery.apiKey)

                const { error } = yield* Effect.tryPromise({
                    try: async () => {
                        const { Resend } = await import('resend')
                        const resend = new Resend(apiKey)

                        return resend.emails.send(
                            {
                                from: config.resendFrom,
                                to: config.resendTo,
                                replyTo: message.email,
                                subject: buildEmailSubject(message.name),
                                text: buildEmailText(message),
                                html: buildEmailHtml(message),
                            },
                            { idempotencyKey: `contact/${message.nonce}` },
                        )
                    },
                    catch: (cause) => new SendFailed({ cause }),
                })

                if (error) {
                    return yield* new SendFailed({ cause: error })
                }
            })

            return Mailer.of({ send })
        }),
    )
}
