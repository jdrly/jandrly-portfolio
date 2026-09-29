// @vitest-environment node
import { ConfigProvider, Effect, Layer, Option, Redacted } from 'effect'
import { describe, expect, it } from 'vitest'
import { ContactConfig } from './config'
import type { ContactConfigShape } from './config'

const SECRETS = {
    FORM_TOKEN_SECRET: 'form-secret',
    TURNSTILE_SECRET_KEY: '0x4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    RESEND_SEND: 're_live',
}
const TEST_TURNSTILE_SECRET = '1x0000000000000000000000000000000AA'

/** Loads the contact configuration from the given environment, like the server does. */
function load(env: Record<string, string>) {
    const layer = ContactConfig.layerNoDotEnv.pipe(Layer.provide(ConfigProvider.layer(ConfigProvider.fromUnknown(env))))
    return Effect.runPromise(ContactConfig.use(Effect.succeed).pipe(Effect.provide(layer)))
}

/** The operational verdict: `ok` with the delivery mode, or the configuration error message. */
function verdict(config: ContactConfigShape) {
    return Effect.runPromise(
        config.operational.pipe(
            Effect.match({
                onSuccess: (operational) => ({
                    ok: true as const,
                    delivery: operational.delivery._tag,
                    testSecret: operational.turnstile.isTestSecret,
                }),
                onFailure: (error) => ({ ok: false as const, message: error.message }),
            }),
        ),
    )
}

describe('ContactConfig', () => {
    it('uses the site defaults when nothing is configured', async () => {
        const config = await load({})

        expect(config).toMatchObject({ isProduction: false, onVercel: false, resendTo: 'jd@jandrly.cz' })
        expect(config.resendFrom).toBe('WEB | jandrly.cz <web@jandrly.cz>')
        expect(config.allowedHostnames).toEqual(['jandrly.cz', 'www.jandrly.cz', 'localhost', '127.0.0.1'])
        expect(Option.isNone(config.upstash)).toBe(true)
    })

    it('parses allowed hostnames and adds local hosts only outside production', async () => {
        const hostnames = ' Jandrly.cz, preview.example.com ,,'

        expect((await load({ CONTACT_ALLOWED_HOSTNAMES: hostnames })).allowedHostnames).toEqual([
            'jandrly.cz',
            'preview.example.com',
            'localhost',
            '127.0.0.1',
        ])
        expect((await load({ CONTACT_ALLOWED_HOSTNAMES: hostnames, NODE_ENV: 'production' })).allowedHostnames).toEqual([
            'jandrly.cz',
            'preview.example.com',
        ])
    })

    it('uses Upstash only when both the URL and the token are set', async () => {
        expect(Option.isNone((await load({ UPSTASH_REDIS_REST_URL: 'https://redis.example.com' })).upstash)).toBe(true)

        const upstash = (await load({ UPSTASH_REDIS_REST_URL: 'https://redis.example.com', UPSTASH_REDIS_REST_TOKEN: 't' })).upstash
        expect(Option.map(upstash, ({ url, token }) => [url, Redacted.value(token)])).toEqual(
            Option.some(['https://redis.example.com', 't']),
        )
    })

    it('rejects an invalid boolean', async () => {
        await expect(load({ CONTACT_DRY_RUN: 'maybe' })).rejects.toThrow()
    })

    describe('operational mode', () => {
        it('is live with every secret', async () => {
            await expect(verdict(await load(SECRETS))).resolves.toEqual({ ok: true, delivery: 'Resend', testSecret: false })
            await expect(verdict(await load({ ...SECRETS, NODE_ENV: 'production' }))).resolves.toMatchObject({ ok: true })
        })

        it.each([
            ['FORM_TOKEN_SECRET', 'FORM_TOKEN_SECRET is not set'],
            ['TURNSTILE_SECRET_KEY', 'TURNSTILE_SECRET_KEY is not set'],
            ['RESEND_SEND', 'RESEND_SEND is not set'],
        ] as const)('needs %s', async (name, message) => {
            const { [name]: _missing, ...rest } = SECRETS

            await expect(verdict(await load(rest))).resolves.toEqual({ ok: false, message })
        })

        it('does not need the Resend key for a dry run in development', async () => {
            const { RESEND_SEND: _key, ...rest } = SECRETS

            await expect(verdict(await load({ ...rest, CONTACT_DRY_RUN: 'true' }))).resolves.toMatchObject({ ok: true, delivery: 'DryRun' })
        })

        it('refuses a dry run in production', async () => {
            await expect(verdict(await load({ ...SECRETS, CONTACT_DRY_RUN: 'true', NODE_ENV: 'production' }))).resolves.toEqual({
                ok: false,
                message: 'CONTACT_DRY_RUN is not allowed in production',
            })
        })

        it('accepts the Turnstile test secret only outside production', async () => {
            const env = { ...SECRETS, TURNSTILE_SECRET_KEY: TEST_TURNSTILE_SECRET }

            await expect(verdict(await load(env))).resolves.toMatchObject({ ok: true, testSecret: true })
            await expect(verdict(await load({ ...env, NODE_ENV: 'production' }))).resolves.toEqual({
                ok: false,
                message: 'Turnstile test secret used in production',
            })
        })

        it('only needs the form token secret to issue form tokens', async () => {
            const config = await load({ FORM_TOKEN_SECRET: 'form-secret' })

            await expect(Effect.runPromise(config.formTokenSecret.pipe(Effect.map(Redacted.value)))).resolves.toBe('form-secret')
            await expect(verdict(config)).resolves.toMatchObject({ ok: false })
        })
    })
})
