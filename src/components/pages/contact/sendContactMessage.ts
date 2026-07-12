import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

const DEFAULT_CONTACT_EMAIL = 'jd@jandrly.cz'
const DEFAULT_FROM_EMAIL = 'WEB | jandrly.cz <web@jandrly.cz>'
const MIN_FORM_COMPLETION_MS = 3_000
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export const contactMessageSchema = z.object({
    name: z.string().trim().min(2).max(120),
    email: z.email().trim().max(254),
    phone: z.string().trim().max(40).optional(),
    message: z.string().trim().min(10).max(5000),
    website: z.string().max(200).optional(),
    formStartedAt: z.number().int().positive(),
    turnstileToken: z.string().min(1).max(2048),
})

type ServerEnv = {
    RESEND_SEND?: string
    RESEND_FROM?: string
    RESEND_TO?: string
    TURNSTILE_SECRET_KEY?: string
}

type ContactMessage = z.infer<typeof contactMessageSchema>

const turnstileResponseSchema = z.object({
    success: z.boolean(),
    action: z.string().optional(),
})

function escapeHtml(value: string) {
    return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;')
}

function buildEmailText(data: ContactMessage) {
    return [`Name: ${data.name}`, `Email: ${data.email}`, `Phone: ${data.phone || 'Not provided'}`, '', 'Message:', data.message].join('\n')
}

function buildEmailHtml(data: ContactMessage) {
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

async function readLocalEnvFile(): Promise<ServerEnv> {
    if (process.env.NODE_ENV === 'production') {
        return {}
    }

    try {
        const [{ readFile }, { resolve }] = await Promise.all([import('node:fs/promises'), import('node:path')])
        const envFile = await readFile(resolve(process.cwd(), '.env'), 'utf8')

        return Object.fromEntries(
            envFile
                .split('\n')
                .map((line) => line.trim())
                .filter((line) => line && !line.startsWith('#') && line.includes('='))
                .map((line) => {
                    const separatorIndex = line.indexOf('=')
                    const key = line.slice(0, separatorIndex)
                    const value = line
                        .slice(separatorIndex + 1)
                        .trim()
                        .replace(/^["']|["']$/g, '')

                    return [key, value]
                }),
        )
    } catch {
        return {}
    }
}

async function getServerEnv(): Promise<ServerEnv> {
    const localEnv = await readLocalEnvFile()

    return {
        RESEND_SEND: process.env.RESEND_SEND || localEnv.RESEND_SEND,
        RESEND_FROM: process.env.RESEND_FROM || localEnv.RESEND_FROM || DEFAULT_FROM_EMAIL,
        RESEND_TO: process.env.RESEND_TO || localEnv.RESEND_TO || DEFAULT_CONTACT_EMAIL,
        TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY || localEnv.TURNSTILE_SECRET_KEY,
    }
}

export function isLikelyBotSubmission(data: Pick<ContactMessage, 'website' | 'formStartedAt'>, now = Date.now()) {
    const completionTime = now - data.formStartedAt

    return Boolean(data.website) || completionTime < MIN_FORM_COMPLETION_MS
}

export async function verifyTurnstileToken(token: string, secret: string) {
    try {
        const response = await fetch(TURNSTILE_VERIFY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ secret, response: token }),
            signal: AbortSignal.timeout(5_000),
        })

        if (!response.ok) {
            return false
        }

        const result = turnstileResponseSchema.safeParse(await response.json())

        return result.success && result.data.success && result.data.action === 'contact'
    } catch (error) {
        console.error('Turnstile verification failed', error)
        return false
    }
}

export const sendContactMessage = createServerFn({ method: 'POST' })
    .validator(contactMessageSchema)
    .handler(async ({ data }) => {
        if (isLikelyBotSubmission(data)) {
            return { status: 'success' as const }
        }

        const { RESEND_SEND, RESEND_FROM, RESEND_TO, TURNSTILE_SECRET_KEY } = await getServerEnv()

        if (!RESEND_SEND || !RESEND_FROM || !RESEND_TO || !TURNSTILE_SECRET_KEY) {
            return { status: 'configuration_error' as const }
        }

        const isVerified = await verifyTurnstileToken(data.turnstileToken, TURNSTILE_SECRET_KEY)

        if (!isVerified) {
            return { status: 'verification_error' as const }
        }

        const { Resend } = await import('resend')
        const resend = new Resend(RESEND_SEND)
        const subject = `New portfolio contact request from ${data.name}`

        try {
            const { error } = await resend.emails.send({
                from: RESEND_FROM,
                to: RESEND_TO,
                replyTo: data.email,
                subject,
                text: buildEmailText(data),
                html: buildEmailHtml(data),
            })

            if (!error) {
                return { status: 'success' as const }
            }

            console.error('Resend contact form failed', error)
        } catch (error) {
            console.error('Resend contact form failed', error)
        }

        return { status: 'send_error' as const }
    })
