// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
    classifyContent,
    containsBlockedPhrase,
    countUrls,
    isDotStuffedGmail,
    isHoneypotFilled,
    isMixedCaseGibberish,
    isMostlyNonLatin,
    normalizeEmailForRateLimit,
} from './checks'

/** The payload of the campaign that kept getting through the old form. */
const CAMPAIGN_PAYLOADS = [
    { name: 'CiaDXxqkparbHyyth', email: 'ma.huz.e.wo.y.on0.8@gmail.com', message: 'XHkXxGvjFZkZzlYmvX' },
    { name: 'Jane Doe', email: 'jane@example.com', message: 'XHkXxGvjFZkZzlYmvX' },
    { name: 'CiaDXxqkparbHyyth', email: 'jane@example.com', message: 'Hello, I would like a new website for my company.' },
    { name: 'Jane Doe', email: 'ma.huz.e.wo.y.on0.8@gmail.com', message: 'Hello, I would like a new website for my company.' },
]

const LEGIT_MESSAGES = [
    { name: 'Jan Novák', email: 'jan.novak@seznam.cz', message: 'Ahoj, mám zájem o web, zavolejte mi.' },
    { name: 'Petra Dvořáková', email: 'petra@firma.cz', message: 'Dobrý den,\nchtěla bych nový e-shop. Kolik by stál?\nDěkuji, Petra' },
    { name: 'Łukasz Żółć', email: 'lukasz@example.pl', message: 'Hi Jan, could you quote a Next.js rebuild of our site?' },
    {
        name: "Seán O'Connor-McDonald",
        email: 'sean.oconnor@gmail.com',
        message: 'We need help with our React Native app, can we talk this week?',
    },
    {
        name: 'Anna-Marie DeLuca',
        email: 'anna.marie.deluca@gmail.com',
        message: 'Chci web s dobrým SEO a rychlým načítáním, ozvěte se prosím.',
    },
    {
        name: 'José García',
        email: 'jose+web@outlook.com',
        message: 'Our getServerSideProps pages are slow, see https://example.com/a and https://example.com/b',
    },
    {
        name: 'Ondřej Čtvrtník',
        email: 'ondrej@čtvrtník.cz',
        message: 'Strč prst skrz krk. Potřebuji upravit PostgreSQL databázi a TypeScript API.',
    },
    { name: 'Eva', email: 'eva@post.cz', message: 'Zavolejte mi prosím.' },
    { name: 'Tomáš', email: 'tomas@example.com', message: 'Máte volnou kapacitu na projekt? Termín je v březnu 2027.' },
]

describe('classifyContent', () => {
    it.each(CAMPAIGN_PAYLOADS)('flags the known campaign payload %#', (payload) => {
        expect(classifyContent(payload)).not.toBeNull()
    })

    it('reports the specific rule', () => {
        expect(classifyContent(CAMPAIGN_PAYLOADS[1])).toBe('gibberish_message')
        expect(classifyContent(CAMPAIGN_PAYLOADS[2])).toBe('gibberish_name')
        expect(classifyContent(CAMPAIGN_PAYLOADS[3])).toBe('dot_stuffed_gmail')
    })

    it.each(LEGIT_MESSAGES)('lets a normal Czech/English message through: $name', (payload) => {
        expect(classifyContent(payload)).toBeNull()
    })

    it('flags a URL in the name', () => {
        expect(classifyContent({ name: 'Best SEO www.cheap-links.xyz', email: 'a@example.com', message: 'Hello there, nice site.' })).toBe(
            'name_contains_url',
        )
        expect(classifyContent({ name: 'cheapseo.com', email: 'a@example.com', message: 'Hello there, nice site.' })).toBe(
            'name_contains_url',
        )
    })

    it('flags more than two URLs', () => {
        const message = 'Check https://a.example https://b.example and www.c.example today'
        expect(countUrls(message)).toBe(3)
        expect(classifyContent({ name: 'Jane Doe', email: 'a@example.com', message })).toBe('too_many_urls')
    })

    it('flags long whitespace-free tokens that are not URLs', () => {
        const message = `Please see aGVsbG8gd29ybGQgdGhpcyBpcyBhIGxvbmcgYmFzZTY0IGJsb2I= for details`
        expect(classifyContent({ name: 'Jane Doe', email: 'a@example.com', message })).toBe('long_token')
    })

    it('flags mostly non-Latin messages', () => {
        const message = 'Здравствуйте! Предлагаем продвижение вашего сайта в поисковых системах.'
        expect(isMostlyNonLatin(message)).toBe(true)
        expect(classifyContent({ name: 'Ivan', email: 'ivan@example.com', message })).toBe('non_latin_message')
        expect(isMostlyNonLatin('您好，我们提供网站推广服务，价格非常优惠，欢迎联系我们。')).toBe(true)
        expect(isMostlyNonLatin('Příliš žluťoučký kůň úpěl ďábelské ódy.')).toBe(false)
    })

    it('flags blocklisted SEO / crypto / casino phrases in English and Czech', () => {
        expect(containsBlockedPhrase('We offer GUEST POSTS and high DA backlinks')).toBe(true)
        expect(containsBlockedPhrase('Would you accept a guest post on your blog?')).toBe(true)
        expect(containsBlockedPhrase('Nabízíme zpětné odkazy a PR články')).toBe(true)
        expect(containsBlockedPhrase('Generate passive income today')).toBe(true)
        expect(
            classifyContent({ name: 'Mark', email: 'mark@example.com', message: 'I can get your site to the first page of Google.' }),
        ).toBe('blocked_phrase')
    })

    it('does not flag harmless words that contain blocked phrases', () => {
        expect(containsBlockedPhrase('Potřebuji SEO optimalizaci a web pro sázení stromů.')).toBe(false)
        expect(containsBlockedPhrase('The passive incomes-tax calculator is fun')).toBe(false)
    })

    it('lets genuine industry enquiries through', () => {
        expect(
            classifyContent({
                name: 'Jan Novák – Firma.cz',
                email: 'jan@firma.cz',
                message: 'Potřebujeme web pro naši sázkovou kancelář a online kasino.',
            }),
        ).toBeNull()
        expect(
            classifyContent({
                name: 'Mia',
                email: 'mia@example.com',
                message: 'We are building a crypto trading dashboard, can you help?',
            }),
        ).toBeNull()
    })
})

describe('isMixedCaseGibberish', () => {
    it.each(['CiaDXxqkparbHyyth', 'XHkXxGvjFZkZzlYmvX'])('detects %s', (word) => {
        expect(isMixedCaseGibberish(word)).toBe(true)
    })

    it.each(['McDonald', 'PostgreSQL', 'JavaScript', 'LinkedIn', 'AnnaMarieDeLuca', 'McDonaldsWebDesign', 'NASA', 'Dvořáková', 'iPhone'])(
        'accepts %s',
        (word) => {
            expect(isMixedCaseGibberish(word)).toBe(false)
        },
    )
})

describe('isDotStuffedGmail', () => {
    it('flags three or more dots in a Gmail local part', () => {
        expect(isDotStuffedGmail('ma.huz.e.wo.y.on0.8@gmail.com')).toBe(true)
        expect(isDotStuffedGmail('a.b.c.d@googlemail.com')).toBe(true)
    })

    it('allows normal addresses', () => {
        expect(isDotStuffedGmail('jan.novak@gmail.com')).toBe(false)
        expect(isDotStuffedGmail('anna.marie.deluca@gmail.com')).toBe(false)
        expect(isDotStuffedGmail('a.b.c.d@firma.cz')).toBe(false)
    })
})

describe('normalizeEmailForRateLimit', () => {
    it('collapses Gmail dots, plus tags and case', () => {
        expect(normalizeEmailForRateLimit('Ma.Huz.E.wo+x@GoogleMail.com')).toBe('mahuzewo@gmail.com')
        expect(normalizeEmailForRateLimit('jan.novak+web@Firma.cz')).toBe('jan.novak@firma.cz')
    })
})

describe('isHoneypotFilled', () => {
    it('treats empty or missing values as not filled', () => {
        expect(isHoneypotFilled(undefined)).toBe(false)
        expect(isHoneypotFilled('')).toBe(false)
        expect(isHoneypotFilled('  ')).toBe(false)
        expect(isHoneypotFilled('Business proposal')).toBe(true)
    })
})
