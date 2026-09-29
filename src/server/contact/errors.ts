import { Schema } from 'effect'

/** The submitted payload does not match the contact schema. */
export class ValidationError extends Schema.TaggedError<ValidationError>()('ValidationError', {
    issues: Schema.Array(Schema.String),
}) {}

/** Automated submission detected (honeypot, forged/expired form token, BotID). Silently dropped. */
export class BotDetected extends Schema.TaggedError<BotDetected>()('BotDetected', {
    reason: Schema.String,
}) {}

/** The content looks like spam (classifier rule or email domain check). Silently dropped. */
export class SpamContent extends Schema.TaggedError<SpamContent>()('SpamContent', {
    rule: Schema.String,
}) {}

export class RateLimited extends Schema.TaggedError<RateLimited>()('RateLimited', {
    scope: Schema.Literals(['ip', 'email']),
}) {}

export class TurnstileFailed extends Schema.TaggedError<TurnstileFailed>()('TurnstileFailed', {
    codes: Schema.Array(Schema.String),
}) {}

export class ConfigurationError extends Schema.TaggedError<ConfigurationError>()('ConfigurationError', {
    message: Schema.String,
}) {}

export class SendFailed extends Schema.TaggedError<SendFailed>()('SendFailed', {
    cause: Schema.Defect(),
}) {}
