import { Config, ConfigProvider, Context, Effect, Layer, Option, Redacted } from 'effect'
import { ConfigurationError } from './errors'
import { assembleContactEmail } from '@/lib/contact'
import { SITE } from '@/lib/site'

const DEFAULT_FROM = `WEB | ${SITE.domain} <web@${SITE.domain}>`
const DEFAULT_TO = assembleContactEmail()
const DEFAULT_ALLOWED_HOSTNAMES = [SITE.domain, `www.${SITE.domain}`]
const DEV_HOSTNAMES = ['localhost', '127.0.0.1']

/**
 * Cloudflare's documented test secrets. They accept any token and answer with
 * `hostname: "localhost"`/`"example.com"`, `action: "test"`, `cdata: "test-data"`,
 * so strict checks are skipped for them — and they are refused in production.
 */
const TURNSTILE_TEST_SECRETS = new Set([
    '1x0000000000000000000000000000000AA',
    '2x0000000000000000000000000000000AA',
    '3x0000000000000000000000000000000AA',
])

/** The environment as read, before any policy is applied. */
export interface ContactSettings {
    readonly isProduction: boolean
    readonly resendApiKey: Option.Option<Redacted.Redacted<string>>
    readonly resendFrom: string
    readonly resendTo: string
    readonly turnstileSecret: Option.Option<Redacted.Redacted<string>>
    readonly formTokenSecret: Option.Option<Redacted.Redacted<string>>
    /** Hostnames Turnstile must report (`localhost` is added outside production). */
    readonly allowedHostnames: ReadonlyArray<string>
    readonly upstash: Option.Option<{ readonly url: string; readonly token: Redacted.Redacted<string> }>
    /** Log a redacted summary instead of sending the email. Development only. */
    readonly dryRun: boolean
    /** Running on Vercel: BotID is available and `x-real-ip` / `x-forwarded-for` are trustworthy. */
    readonly onVercel: boolean
}

export interface TurnstileCredentials {
    readonly secret: Redacted.Redacted<string>
    /** Cloudflare test secret (development only): siteverify answers are not checked strictly. */
    readonly isTestSecret: boolean
}

export type Delivery = { readonly _tag: 'Resend'; readonly apiKey: Redacted.Redacted<string> } | { readonly _tag: 'DryRun' }

/** Everything a submission needs. */
export interface ContactOperational {
    readonly formTokenSecret: Redacted.Redacted<string>
    readonly turnstile: TurnstileCredentials
    readonly delivery: Delivery
}

export interface ContactConfigShape {
    readonly isProduction: boolean
    readonly resendFrom: string
    readonly resendTo: string
    readonly allowedHostnames: ReadonlyArray<string>
    readonly upstash: ContactSettings['upstash']
    readonly onVercel: boolean
    /** Signing secret for form tokens (enough to render the form). */
    readonly formTokenSecret: Effect.Effect<Redacted.Redacted<string>, ConfigurationError>
    readonly turnstile: Effect.Effect<TurnstileCredentials, ConfigurationError>
    /** Real sending via Resend, or a dry run (never in production). */
    readonly delivery: Effect.Effect<Delivery, ConfigurationError>
    /** All of the above, or the first reason the contact form cannot work in this environment. */
    readonly operational: Effect.Effect<ContactOperational, ConfigurationError>
}

function required<TValue>(value: Option.Option<TValue>, name: string): Effect.Effect<TValue, ConfigurationError> {
    return Option.match(value, {
        onNone: () => Effect.fail(new ConfigurationError({ message: `${name} is not set` })),
        onSome: (present) => Effect.succeed(present),
    })
}

/** Applies the contact form's configuration policy to the raw settings. */
export function makeContactConfig(settings: ContactSettings): ContactConfigShape {
    const allowedHostnames = settings.isProduction
        ? settings.allowedHostnames
        : [...new Set([...settings.allowedHostnames, ...DEV_HOSTNAMES])]

    const formTokenSecret = required(settings.formTokenSecret, 'FORM_TOKEN_SECRET')

    const turnstile = required(settings.turnstileSecret, 'TURNSTILE_SECRET_KEY').pipe(
        Effect.flatMap((secret) => {
            const isTestSecret = TURNSTILE_TEST_SECRETS.has(Redacted.value(secret))

            return isTestSecret && settings.isProduction
                ? Effect.fail(new ConfigurationError({ message: 'Turnstile test secret used in production' }))
                : Effect.succeed<TurnstileCredentials>({ secret, isTestSecret })
        }),
    )

    const delivery: Effect.Effect<Delivery, ConfigurationError> = settings.dryRun
        ? settings.isProduction
            ? Effect.fail(new ConfigurationError({ message: 'CONTACT_DRY_RUN is not allowed in production' }))
            : Effect.succeed({ _tag: 'DryRun' })
        : required(settings.resendApiKey, 'RESEND_SEND').pipe(Effect.map((apiKey) => ({ _tag: 'Resend', apiKey }) as const))

    return {
        isProduction: settings.isProduction,
        resendFrom: settings.resendFrom,
        resendTo: settings.resendTo,
        allowedHostnames,
        upstash: settings.upstash,
        onVercel: settings.onVercel,
        formTokenSecret,
        turnstile,
        delivery,
        operational: Effect.all({ formTokenSecret, turnstile, delivery }),
    }
}

function parseHostnames(value: string) {
    return value
        .split(',')
        .map((hostname) => hostname.trim().toLowerCase())
        .filter(Boolean)
}

const contactSettings = Config.all({
    nodeEnv: Config.String('NODE_ENV').pipe(Config.withDefault('development')),
    resendApiKey: Config.option(Config.Redacted('RESEND_SEND')),
    resendFrom: Config.String('RESEND_FROM').pipe(Config.withDefault(DEFAULT_FROM)),
    resendTo: Config.String('RESEND_TO').pipe(Config.withDefault(DEFAULT_TO)),
    turnstileSecret: Config.option(Config.Redacted('TURNSTILE_SECRET_KEY')),
    formTokenSecret: Config.option(Config.Redacted('FORM_TOKEN_SECRET')),
    allowedHostnames: Config.String('CONTACT_ALLOWED_HOSTNAMES').pipe(Config.withDefault(DEFAULT_ALLOWED_HOSTNAMES.join(','))),
    upstashUrl: Config.option(Config.String('UPSTASH_REDIS_REST_URL')),
    upstashToken: Config.option(Config.Redacted('UPSTASH_REDIS_REST_TOKEN')),
    dryRun: Config.Boolean('CONTACT_DRY_RUN').pipe(Config.withDefault(false)),
    onVercel: Config.Boolean('VERCEL').pipe(Config.withDefault(false)),
}).pipe(
    Config.map((raw): ContactSettings => ({
        // The build may inline `process.env.NODE_ENV`; either source saying "production" counts.
        isProduction: process.env.NODE_ENV === 'production' || raw.nodeEnv === 'production',
        resendApiKey: raw.resendApiKey,
        resendFrom: raw.resendFrom,
        resendTo: raw.resendTo,
        turnstileSecret: raw.turnstileSecret,
        formTokenSecret: raw.formTokenSecret,
        allowedHostnames: parseHostnames(raw.allowedHostnames),
        upstash: Option.all({ url: raw.upstashUrl, token: raw.upstashToken }),
        dryRun: raw.dryRun,
        onVercel: raw.onVercel,
    })),
)

/**
 * In development the Vite dev server does not expose non-`VITE_` variables from
 * `.env` to server code, so fall back to reading the file. Real environment
 * variables always win. Never used in production.
 */
const devDotEnvProvider = Effect.promise(async () => {
    try {
        const [{ readFile }, { resolve }] = await Promise.all([import('node:fs/promises'), import('node:path')])
        const contents = await readFile(resolve(process.cwd(), '.env'), 'utf8')

        return ConfigProvider.fromDotEnvContents(contents)
    } catch {
        return ConfigProvider.fromUnknown({})
    }
})

export class ContactConfig extends Context.Service<ContactConfig, ContactConfigShape>()('jandrly/server/contact/ContactConfig') {
    /** Reads the environment from the current `ConfigProvider`. */
    static readonly layerNoDotEnv = Layer.effect(
        ContactConfig,
        Effect.gen(function* () {
            const settings = yield* contactSettings
            return ContactConfig.of(makeContactConfig(settings))
        }),
    )

    static readonly layer =
        process.env.NODE_ENV === 'production'
            ? ContactConfig.layerNoDotEnv
            : ContactConfig.layerNoDotEnv.pipe(Layer.provide(ConfigProvider.layerAdd(devDotEnvProvider)))

    /** Settings for tests; the real configuration policy still applies. */
    static readonly layerTest = (overrides: Partial<ContactSettings> = {}) =>
        Layer.succeed(
            ContactConfig,
            makeContactConfig({
                isProduction: false,
                resendApiKey: Option.none(),
                resendFrom: DEFAULT_FROM,
                resendTo: DEFAULT_TO,
                turnstileSecret: Option.none(),
                formTokenSecret: Option.none(),
                allowedHostnames: DEFAULT_ALLOWED_HOSTNAMES,
                upstash: Option.none(),
                dryRun: false,
                onVercel: false,
                ...overrides,
            }),
        )
}
