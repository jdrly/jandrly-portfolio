/**
 * Pure, dependency-free spam heuristics. Every rule is tuned for high precision:
 * a false positive silently drops a real enquiry, so when in doubt a rule lets
 * the message through and relies on the other layers (Turnstile, BotID, rate limits).
 */

export type SpamRule =
    | 'gibberish_name'
    | 'name_contains_url'
    | 'gibberish_message'
    | 'long_token'
    | 'too_many_urls'
    | 'blocked_phrase'
    | 'non_latin_message'
    | 'dot_stuffed_gmail'

export interface ClassifierInput {
    name: string
    email: string
    message: string
}

const URL_PATTERN = /\b(?:https?:\/\/|www\.)[^\s<>"']+/giu
const DOMAIN_IN_NAME_PATTERN =
    /(?:https?:\/\/|www\.)|\b[\p{L}\d-]+\.(?:com|net|org|info|biz|ru|su|xyz|top|site|online|shop|store|link|click)\b/iu
const EMAIL_PATTERN = /[^\s@]+@[^\s@]+\.[^\s@]+/u
const LETTER = /\p{L}/u
const LATIN_LETTER = /\p{Script=Latin}/u
const UPPER = /\p{Lu}/u
const LOWER = /\p{Ll}/u

const MAX_URLS = 2
const LONG_TOKEN_LENGTH = 40
const MIN_LETTERS_FOR_SCRIPT_CHECK = 20
const MIN_LATIN_RATIO = 0.5

/**
 * Spam phrases (EN + CS). Matched against a lowercased, diacritics-free copy of the
 * text on word boundaries. Only phrases that practically never occur in a genuine
 * web-development enquiry belong here; a plain "SEO" mention is fine.
 */
const BLOCKED_PHRASES = [
    // SEO / backlink outreach
    'guest post',
    'guest posting',
    'sponsored post',
    'write for us',
    'backlink',
    'backlinks',
    'link building',
    'link-building',
    'linkbuilding',
    'domain authority',
    'first page of google',
    'top of google',
    'rank your website',
    'rank your site',
    'increase your traffic',
    'boost your traffic',
    'targeted traffic',
    'seo services',
    'seo package',
    'seo audit report',
    'your website is not ranking',
    'we are a digital marketing agency',
    'white label seo',
    // finance scams / pharma. Industry words (crypto, casino, betting, forex) are
    // deliberately absent: a genuine client may want exactly such a product built.
    'binary options',
    'investment opportunity',
    'passive income',
    'viagra',
    'cialis',
    'payday loan',
    // Czech
    'zpetne odkazy',
    'zpetnych odkazu',
    'zpetnymi odkazy',
    'pr clanek',
    'pr clanku',
    'pr clanky',
    'prvni strance googlu',
    'prvni stranku googlu',
    'prvni strance google',
    'prvni stranku google',
    'rychla pujcka',
    'pasivni prijem',
] as const

function normalizeForMatching(value: string) {
    return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

const BLOCKED_PHRASE_PATTERN = new RegExp(
    `(?:^|[^\\p{L}\\d])(?:${BLOCKED_PHRASES.map((phrase) => phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+')).join('|')})(?=$|[^\\p{L}\\d])`,
    'u',
)

export function countUrls(text: string) {
    return text.match(URL_PATTERN)?.length ?? 0
}

export function containsBlockedPhrase(text: string) {
    return BLOCKED_PHRASE_PATTERN.test(normalizeForMatching(text))
}

/**
 * Detects random-looking mixed-case strings such as `CiaDXxqkparbHyyth` while
 * letting through real words, names and identifiers (`McDonald`, `PostgreSQL`,
 * `JavaScript`, `getServerSideProps` is only checked when it is the whole message).
 */
export function isMixedCaseGibberish(word: string) {
    const letters = [...word].filter((char) => LETTER.test(char))

    if (letters.length < 8 || letters.length !== [...word].length) {
        return false
    }

    let innerUpper = 0
    let lowerToUpper = 0
    let upperToLower = 0

    for (let index = 1; index < letters.length; index++) {
        const previous = letters[index - 1]
        const current = letters[index]
        const currentUpper = UPPER.test(current)

        if (currentUpper) {
            innerUpper++
        }

        if (LOWER.test(previous) && currentUpper) {
            lowerToUpper++
        }

        if (UPPER.test(previous) && LOWER.test(current)) {
            upperToLower++
        }
    }

    const isAllCaps = innerUpper === letters.length - 1

    if (isAllCaps || innerUpper < 3 || lowerToUpper < 2 || lowerToUpper + upperToLower < 4) {
        return false
    }

    // Real camel/Pascal-cased words (`AnnaMarieDeLuca`, `McDonaldsWebDesign`) switch case
    // too, but they almost never contain a run of 2+ capitals followed by lowercase
    // ("DXx", "FZk") and they have a normal share of vowels.
    const hasUpperRunThenLower = /\p{Lu}{2,}\p{Ll}/u.test(word)
    const vowels = [...normalizeForMatching(word)].filter((char) => 'aeiou'.includes(char)).length

    return hasUpperRunThenLower || vowels / letters.length < 0.25
}

function tokens(text: string) {
    return text.split(/\s+/u).filter(Boolean)
}

function hasGibberishName(name: string) {
    return tokens(name).some(isMixedCaseGibberish)
}

function nameContainsUrl(name: string) {
    return DOMAIN_IN_NAME_PATTERN.test(name) || EMAIL_PATTERN.test(name)
}

/** The whole message is a single token: either random mixed case or long with no whitespace at all. */
function hasGibberishMessage(message: string) {
    const parts = tokens(message)

    if (parts.length !== 1) {
        return false
    }

    const [only] = parts

    return isMixedCaseGibberish(only) || (only.length >= 20 && countUrls(only) === 0)
}

/** A token of 40+ characters that is neither a URL nor an email address (base64 blobs, keyword soup). */
function hasLongToken(message: string) {
    return tokens(message).some((token) => token.length >= LONG_TOKEN_LENGTH && countUrls(token) === 0 && !EMAIL_PATTERN.test(token))
}

/** True when most letters are outside the Latin script (Cyrillic, CJK, ...). Czech diacritics are Latin. */
export function isMostlyNonLatin(text: string) {
    let letters = 0
    let latin = 0

    for (const char of text) {
        if (LETTER.test(char)) {
            letters++

            if (LATIN_LETTER.test(char)) {
                latin++
            }
        }
    }

    return letters >= MIN_LETTERS_FOR_SCRIPT_CHECK && latin / letters < MIN_LATIN_RATIO
}

export function splitEmail(email: string) {
    const at = email.lastIndexOf('@')

    return { local: email.slice(0, at), domain: email.slice(at + 1).toLowerCase() }
}

const GMAIL_DOMAINS = new Set(['gmail.com', 'googlemail.com'])

/** Gmail ignores dots, so spammers stuff them in to generate "unique" addresses: `ma.huz.e.wo.y.on0.8@gmail.com`. */
export function isDotStuffedGmail(email: string) {
    const { local, domain } = splitEmail(email)

    return GMAIL_DOMAINS.has(domain) && (local.match(/\./g)?.length ?? 0) >= 3
}

/** Runs all content rules and returns the first one that matches. */
export function classifyContent({ name, email, message }: ClassifierInput): SpamRule | null {
    if (nameContainsUrl(name)) return 'name_contains_url'
    if (hasGibberishName(name)) return 'gibberish_name'
    if (isDotStuffedGmail(email)) return 'dot_stuffed_gmail'
    if (hasGibberishMessage(message)) return 'gibberish_message'
    if (hasLongToken(message)) return 'long_token'
    if (countUrls(message) > MAX_URLS) return 'too_many_urls'
    if (containsBlockedPhrase(`${name}\n${message}`)) return 'blocked_phrase'
    if (isMostlyNonLatin(message)) return 'non_latin_message'

    return null
}

export function isHoneypotFilled(value: string | undefined) {
    return typeof value === 'string' && value.trim().length > 0
}

/**
 * Canonical form of an email address for per-address rate limiting, so
 * `J.a.n+promo@Gmail.com` and `jan@gmail.com` share one bucket.
 */
export function normalizeEmailForRateLimit(email: string) {
    const { local, domain } = splitEmail(email.trim().toLowerCase())
    const withoutTag = local.split('+')[0]
    const canonicalDomain = domain === 'googlemail.com' ? 'gmail.com' : domain
    const canonicalLocal = canonicalDomain === 'gmail.com' ? withoutTag.replaceAll('.', '') : withoutTag

    return `${canonicalLocal}@${canonicalDomain}`
}
