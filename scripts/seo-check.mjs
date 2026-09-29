#!/usr/bin/env node
/**
 * Technical SEO crawler. Starts from `<baseUrl>/robots.txt` and `<baseUrl>/sitemap.xml`, fetches every sitemap URL
 * (mapped onto <baseUrl>, so a local production build can be checked before deploying), every internal link and a
 * known-404 URL, and exits non-zero when a rule fails. No dependencies: fetch + a small HTML tag scanner.
 *
 * Usage:
 *   pnpm seo:check http://localhost:3000
 *   pnpm seo:check https://www.jandrly.cz
 *   pnpm seo:check http://localhost:3000 --lighthouse [--lh-min=accessibility:0.95,seo:0.95] [--lh-preset=desktop]
 *
 * Errors (exit 1): missing/duplicate title or description, title > 65 / description > 165 characters, canonical
 * missing/mismatching the sitemap URL, hreflang without self or x-default or not reciprocal, unparseable JSON-LD or
 * without @context/@type, broken internal links, H1 count ≠ 1, <img> without alt, missing <html lang>, noindex on a
 * sitemap URL, 404 page not answering 404 or without noindex, robots.txt without a Sitemap line, malformed
 * verification meta tags, Lighthouse category below its threshold (with --lighthouse).
 * Warnings (exit 0): title > 60, description > 155 or < 50 characters, og:url ≠ canonical, lang ≠ hreflang,
 * internal links that redirect, sitemap alternates that differ from the page's.
 */
import { execFile } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'

const LIMITS = { titleWarn: 60, titleMax: 65, descWarn: 155, descMax: 165, descMin: 50 }
const LIGHTHOUSE_DEFAULT_MIN = { performance: 0, accessibility: 0.95, 'best-practices': 0.95, seo: 0.95 }
const FETCH_CONCURRENCY = 6
const HREFLANG = /^(x-default|[a-z]{2,3}(-[a-z]{4})?(-([a-z]{2}|\d{3}))?)$/i
const VERIFICATION_META = ['google-site-verification', 'msvalidate.01', 'seznam-wmt', 'yandex-verification']

// ---------------------------------------------------------------------------------------------------------------
// CLI

function parseArgs(argv) {
    const args = { base: undefined, lighthouse: false, lhMin: { ...LIGHTHOUSE_DEFAULT_MIN }, lhPreset: 'mobile', lhLimit: Infinity }
    for (const arg of argv) {
        if (arg === '--lighthouse') args.lighthouse = true
        else if (arg.startsWith('--lh-min=')) {
            args.lighthouse = true
            for (const pair of arg.slice('--lh-min='.length).split(',')) {
                const [category, value] = pair.split(':')
                const min = Number(value)
                if (!(category in LIGHTHOUSE_DEFAULT_MIN) || !(min >= 0 && min <= 1)) throw new Error(`Bad --lh-min entry: ${pair}`)
                args.lhMin[category] = min
            }
        } else if (arg.startsWith('--lh-preset=')) args.lhPreset = arg.slice('--lh-preset='.length)
        else if (arg.startsWith('--lh-limit=')) args.lhLimit = Number(arg.slice('--lh-limit='.length))
        else if (arg === '--help' || arg === '-h') {
            console.log(
                'Usage: node scripts/seo-check.mjs <baseUrl> [--lighthouse] [--lh-min=category:0.9,...] [--lh-preset=mobile|desktop] [--lh-limit=N]',
            )
            process.exit(0)
        } else if (!arg.startsWith('-') && !args.base) args.base = arg
        else throw new Error(`Unknown argument: ${arg}`)
    }
    if (!args.base) throw new Error('Missing <baseUrl>, e.g. `pnpm seo:check http://localhost:3000`')
    args.base = new URL(args.base).origin
    if (!['mobile', 'desktop'].includes(args.lhPreset)) throw new Error('--lh-preset must be mobile or desktop')
    return args
}

// ---------------------------------------------------------------------------------------------------------------
// Reporting

const issues = []

function report(level, where, message) {
    issues.push({ level, where, message })
}
const error = (where, message) => report('error', where, message)
const warn = (where, message) => report('warn', where, message)

// ---------------------------------------------------------------------------------------------------------------
// HTML scanning (enough for server-rendered markup; not a general parser)

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', hellip: '…' }

function decodeEntities(value) {
    return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, body) => {
        if (body[0] === '#') {
            const code = body[1] === 'x' || body[1] === 'X' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10)
            return Number.isFinite(code) ? String.fromCodePoint(code) : entity
        }
        return ENTITIES[body.toLowerCase()] ?? entity
    })
}

function parseAttributes(source) {
    const attributes = {}
    for (const match of source.matchAll(/([^\s=/>"']+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>"']+)))?/g)) {
        attributes[match[1].toLowerCase()] = decodeEntities(match[2] ?? match[3] ?? match[4] ?? '')
    }
    return attributes
}

/** Opening tags of `name` in `html`, with their attributes. */
function findTags(html, name) {
    return [...html.matchAll(new RegExp(`<${name}(?=[\\s/>])([^>]*)>`, 'gi'))].map((match) => parseAttributes(match[1]))
}

function textLength(value) {
    return [...value].length
}

function parsePage(rawHtml) {
    const jsonLd = [...rawHtml.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
        .filter((match) => /application\/ld\+json/i.test(parseAttributes(match[1]).type ?? ''))
        .map((match) => match[2])
    // Script/style/template bodies and comments never contain elements that count for SEO.
    const html = rawHtml.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style|template|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    const head = /<head\b[^>]*>([\s\S]*?)<\/head>/i.exec(html)?.[1] ?? ''
    const body = /<body\b[^>]*>([\s\S]*)<\/body>/i.exec(html)?.[1] ?? html

    const titles = [...head.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)].map((match) => decodeEntities(match[1]).trim())
    const metas = findTags(head, 'meta')
    const metaNamed = (name) => metas.filter((meta) => (meta.name ?? meta.property)?.toLowerCase() === name)
    const links = findTags(head, 'link')
    const relIs = (link, rel) => (link.rel ?? '').toLowerCase().split(/\s+/).includes(rel)

    return {
        lang: findTags(html, 'html')[0]?.lang?.trim(),
        titles,
        descriptions: metaNamed('description').map((meta) => meta.content ?? ''),
        robots: metaNamed('robots').map((meta) => (meta.content ?? '').toLowerCase()),
        ogUrl: metaNamed('og:url')[0]?.content,
        ogImage: metaNamed('og:image')[0]?.content,
        verification: VERIFICATION_META.flatMap((name) => metaNamed(name).map((meta) => ({ name, content: meta.content ?? '' }))),
        canonicals: links.filter((link) => relIs(link, 'canonical')).map((link) => link.href ?? ''),
        alternates: links
            .filter((link) => relIs(link, 'alternate') && link.hreflang)
            .map((link) => ({ hreflang: link.hreflang, href: link.href ?? '' })),
        h1Count: (body.match(/<h1(?=[\s>])/gi) ?? []).length,
        imagesWithoutAlt: findTags(body, 'img')
            .filter((img) => !('alt' in img))
            .map((img) => img.src ?? img.srcset ?? '(no src)'),
        anchors: findTags(body, 'a')
            .map((a) => a.href)
            .filter((href) => href !== undefined),
        jsonLd,
    }
}

// ---------------------------------------------------------------------------------------------------------------
// Fetching

async function get(url, { redirect = 'follow' } = {}) {
    try {
        const response = await fetch(url, { redirect, headers: { 'User-Agent': 'jandrly-seo-check/1.0', Accept: 'text/html,*/*' } })
        return {
            status: response.status,
            redirected: response.redirected,
            finalUrl: response.url,
            headers: response.headers,
            text: await response.text(),
        }
    } catch (cause) {
        return {
            status: 0,
            redirected: false,
            finalUrl: url,
            headers: new Headers(),
            text: '',
            failure: String(cause?.cause?.code ?? cause),
        }
    }
}

async function mapLimit(items, limit, fn) {
    const results = new Array(items.length)
    let next = 0
    const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (next < items.length) {
            const index = next++
            results[index] = await fn(items[index], index)
        }
    })
    await Promise.all(workers)
    return results
}

// ---------------------------------------------------------------------------------------------------------------
// Checks

function checkRobots(robots, base) {
    const where = `${base}/robots.txt`
    if (robots.status !== 200) return error(where, `HTTP ${robots.status || robots.failure}`)
    const lines = robots.text.split(/\r?\n/).map((line) => line.replace(/#.*/, '').trim())
    const sitemaps = lines.filter((line) => /^sitemap\s*:/i.test(line)).map((line) => line.replace(/^sitemap\s*:\s*/i, ''))
    if (sitemaps.length === 0) error(where, 'no `Sitemap:` line')

    // `Disallow: /` inside the `User-agent: *` group blocks the whole site.
    let inWildcardGroup = false
    let previousWasAgent = false
    for (const line of lines) {
        const [field, ...rest] = line.split(':')
        const key = field.trim().toLowerCase()
        const value = rest.join(':').trim()
        if (key === 'user-agent') {
            inWildcardGroup = previousWasAgent ? inWildcardGroup || value === '*' : value === '*'
            previousWasAgent = true
            continue
        }
        if (key) previousWasAgent = false
        if (inWildcardGroup && key === 'disallow' && value === '/') error(where, '`Disallow: /` for `User-agent: *` blocks the site')
    }
    return sitemaps
}

function parseSitemap(xml) {
    return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((match) => ({
        loc: decodeEntities(/<loc>\s*([^<\s]+)\s*<\/loc>/.exec(match[1])?.[1] ?? ''),
        alternates: [...match[1].matchAll(/<xhtml:link\b([^>]*)\/?>/g)]
            .map((link) => parseAttributes(link[1]))
            .filter((link) => link.hreflang)
            .map((link) => ({ hreflang: link.hreflang, href: link.href ?? '' })),
    }))
}

function alternatesKey(alternates) {
    return alternates
        .map(({ hreflang, href }) => `${hreflang.toLowerCase()} ${href}`)
        .sort()
        .join('\n')
}

function checkJsonLd(where, blocks) {
    blocks.forEach((source, index) => {
        let data
        try {
            data = JSON.parse(source)
        } catch (cause) {
            return error(where, `JSON-LD #${index + 1} is not valid JSON (${cause.message})`)
        }
        for (const [itemIndex, item] of (Array.isArray(data) ? data : [data]).entries()) {
            const label = `JSON-LD #${index + 1}${Array.isArray(data) ? `[${itemIndex}]` : ''}`
            if (!item || typeof item !== 'object') {
                error(where, `${label} is not an object`)
                continue
            }
            if (!item['@context']) error(where, `${label} has no @context`)
            const nodes = Array.isArray(item['@graph']) ? item['@graph'] : [item]
            if (Array.isArray(item['@graph']) && nodes.length === 0) error(where, `${label} has an empty @graph`)
            nodes.forEach((node, nodeIndex) => {
                if (!node?.['@type']) error(where, `${label}${item['@graph'] ? ` @graph[${nodeIndex}]` : ''} has no @type`)
            })
        }
    })
}

function checkPage(where, page, loc) {
    if (!page.lang) error(where, '<html> has no lang attribute')

    if (page.titles.length !== 1) error(where, `${page.titles.length} <title> elements (expected 1)`)
    const title = page.titles[0] ?? ''
    if (page.titles.length && !title) error(where, 'empty <title>')
    const titleLength = textLength(title)
    if (titleLength > LIMITS.titleMax) error(where, `title is ${titleLength} characters (max ${LIMITS.titleMax}): "${title}"`)
    else if (titleLength > LIMITS.titleWarn) warn(where, `title is ${titleLength} characters (aim for ≤ ${LIMITS.titleWarn}): "${title}"`)

    if (page.descriptions.length !== 1) error(where, `${page.descriptions.length} meta descriptions (expected 1)`)
    const description = (page.descriptions[0] ?? '').trim()
    if (page.descriptions.length && !description) error(where, 'empty meta description')
    const descLength = textLength(description)
    if (descLength > LIMITS.descMax) error(where, `description is ${descLength} characters (max ${LIMITS.descMax})`)
    else if (descLength > LIMITS.descWarn) warn(where, `description is ${descLength} characters (aim for ≤ ${LIMITS.descWarn})`)
    else if (description && descLength < LIMITS.descMin) warn(where, `description is only ${descLength} characters`)

    if (page.robots.some((robots) => /\b(noindex|none)\b/.test(robots))) error(where, `sitemap URL is noindex (${page.robots.join('; ')})`)

    if (page.canonicals.length !== 1) error(where, `${page.canonicals.length} canonical links (expected 1)`)
    else if (page.canonicals[0] !== loc) error(where, `canonical ${page.canonicals[0]} ≠ sitemap URL ${loc}`)
    if (page.ogUrl && page.ogUrl !== loc) warn(where, `og:url ${page.ogUrl} ≠ canonical ${loc}`)

    if (page.h1Count !== 1) error(where, `${page.h1Count} <h1> elements (expected 1)`)
    for (const src of page.imagesWithoutAlt) error(where, `<img> without alt: ${src}`)

    for (const { name, content } of page.verification) {
        if (!/^[\w\-.+/=]{6,}$/.test(content)) error(where, `malformed ${name} verification token: "${content}"`)
    }
    const verificationNames = page.verification.map((meta) => meta.name)
    for (const name of new Set(verificationNames)) {
        if (verificationNames.filter((other) => other === name).length > 1) error(where, `duplicate ${name} meta tag`)
    }

    checkJsonLd(where, page.jsonLd)
}

function checkHreflang(pages) {
    const byLoc = new Map(pages.map((page) => [page.loc, page]))
    for (const { loc, where, parsed } of pages) {
        const alternates = parsed.alternates
        if (alternates.length === 0) {
            error(where, 'no hreflang alternates')
            continue
        }
        for (const { hreflang, href } of alternates) {
            if (!HREFLANG.test(hreflang)) error(where, `invalid hreflang value "${hreflang}"`)
            if (!/^https?:\/\//.test(href)) error(where, `hreflang ${hreflang} href is not absolute: ${href}`)
        }
        const values = alternates.map((alternate) => alternate.hreflang.toLowerCase())
        for (const value of new Set(values)) {
            if (values.filter((other) => other === value).length > 1) error(where, `hreflang "${value}" listed more than once`)
        }
        const selfValues = alternates.filter((alternate) => alternate.href === loc).map((alternate) => alternate.hreflang.toLowerCase())
        if (selfValues.filter((value) => value !== 'x-default').length === 0)
            error(where, 'hreflang set does not reference the page itself')
        if (!values.includes('x-default')) error(where, 'hreflang set has no x-default')

        const lang = parsed.lang?.toLowerCase().split('-')[0]
        if (lang && selfValues.length && !selfValues.some((value) => value.split('-')[0] === lang)) {
            warn(where, `<html lang="${parsed.lang}"> matches none of the self hreflang values (${selfValues.join(', ')})`)
        }

        for (const { hreflang, href } of alternates) {
            if (href === loc) continue
            const target = byLoc.get(href)
            if (!target) {
                error(where, `hreflang ${hreflang} → ${href} is not in the sitemap`)
                continue
            }
            if (!target.parsed.alternates.some((alternate) => alternate.href === loc)) {
                error(where, `hreflang ${hreflang} → ${href} does not link back (not reciprocal)`)
            }
        }
    }
}

function checkDuplicates(pages, field, label) {
    const seen = new Map()
    for (const page of pages) {
        const value = page.parsed[field][0]?.trim()
        if (!value) continue
        if (seen.has(value)) error(page.where, `duplicate ${label} (also on ${seen.get(value)}): "${value}"`)
        else seen.set(value, page.where)
    }
}

async function checkNotFound(base) {
    const suffix = `seo-check-missing-${Date.now().toString(36)}`
    for (const path of [`/${suffix}`, `/en/${suffix}`]) {
        const url = `${base}${path}`
        const response = await get(url)
        if (response.status !== 404) error(url, `unknown URL answered HTTP ${response.status || response.failure} (expected 404)`)
        const parsed = parsePage(response.text)
        if (!parsed.robots.some((robots) => /\b(noindex|none)\b/.test(robots))) error(url, '404 page has no robots noindex')
        if (!parsed.lang) error(url, '404 page has no <html lang>')
    }
}

// ---------------------------------------------------------------------------------------------------------------
// Lighthouse (optional)

const run = promisify(execFile)

async function runLighthouse(urls, args) {
    const dir = await mkdtemp(join(tmpdir(), 'seo-check-lh-'))
    try {
        for (const [index, url] of urls.slice(0, args.lhLimit).entries()) {
            const output = join(dir, `${index}.json`)
            const flags = [
                '-y',
                'lighthouse@13',
                url,
                '--only-categories=performance,accessibility,best-practices,seo',
                '--output=json',
                `--output-path=${output}`,
                '--quiet',
                `--chrome-flags=--headless=new --no-sandbox`,
                ...(args.lhPreset === 'desktop' ? ['--preset=desktop'] : []),
            ]
            try {
                await run('npx', flags, { maxBuffer: 64 * 1024 * 1024, timeout: 180_000 })
            } catch (cause) {
                error(
                    url,
                    `Lighthouse failed: ${String(cause.stderr || cause.message)
                        .split('\n')
                        .slice(-3)
                        .join(' ')}`,
                )
                continue
            }
            const result = JSON.parse(await readFile(output, 'utf8'))
            const scores = Object.fromEntries(Object.entries(result.categories).map(([id, category]) => [id, category.score ?? 0]))
            console.log(
                `  lighthouse ${args.lhPreset} ${url}: ` +
                    Object.entries(scores)
                        .map(([id, score]) => `${id} ${Math.round(score * 100)}`)
                        .join(', '),
            )
            for (const [category, min] of Object.entries(args.lhMin)) {
                if ((scores[category] ?? 0) < min) {
                    const failing = Object.values(result.audits)
                        .filter(
                            (audit) =>
                                audit.score !== null &&
                                audit.score < 0.9 &&
                                result.categories[category]?.auditRefs.some((ref) => ref.id === audit.id && ref.weight > 0),
                        )
                        .map((audit) => audit.id)
                    error(
                        url,
                        `Lighthouse ${category} ${Math.round(scores[category] * 100)} < ${Math.round(min * 100)} (${failing.join(', ') || 'see report'})`,
                    )
                }
            }
        }
    } finally {
        await rm(dir, { recursive: true, force: true })
    }
}

// ---------------------------------------------------------------------------------------------------------------

async function main() {
    const args = parseArgs(process.argv.slice(2))
    const { base } = args
    console.log(`SEO check: ${base}`)

    const robots = await get(`${base}/robots.txt`)
    const robotsSitemaps = checkRobots(robots, base) ?? []

    const sitemapResponse = await get(`${base}/sitemap.xml`)
    if (sitemapResponse.status !== 200) {
        error(`${base}/sitemap.xml`, `HTTP ${sitemapResponse.status || sitemapResponse.failure}`)
        return finish()
    }
    const entries = parseSitemap(sitemapResponse.text).filter((entry) => entry.loc)
    if (entries.length === 0) {
        error(`${base}/sitemap.xml`, 'no <url><loc> entries')
        return finish()
    }

    // Sitemap URLs are canonical (production) URLs; fetch them from <baseUrl> so local builds can be checked.
    const siteOrigin = new URL(entries[0].loc).origin
    const toBase = (url) => {
        const parsed = new URL(url)
        return parsed.origin === siteOrigin ? `${base}${parsed.pathname}${parsed.search}` : url
    }
    const sameSite = (url) =>
        url.hostname.replace(/^www\./, '') === new URL(siteOrigin).hostname.replace(/^www\./, '') || url.origin === base

    if (robotsSitemaps.length && !robotsSitemaps.includes(`${siteOrigin}/sitemap.xml`)) {
        error(`${base}/robots.txt`, `Sitemap line(s) ${robotsSitemaps.join(', ')} do not point to ${siteOrigin}/sitemap.xml`)
    }
    const locs = entries.map((entry) => entry.loc)
    for (const loc of new Set(locs)) {
        if (locs.filter((other) => other === loc).length > 1) error(`${base}/sitemap.xml`, `duplicate <loc> ${loc}`)
        if (new URL(loc).origin !== siteOrigin) error(`${base}/sitemap.xml`, `<loc> ${loc} is not on ${siteOrigin}`)
    }

    const pages = await mapLimit(entries, FETCH_CONCURRENCY, async ({ loc, alternates }) => {
        const where = toBase(loc)
        const response = await get(where, { redirect: 'manual' })
        if (response.status !== 200)
            error(
                where,
                `sitemap URL answered HTTP ${response.status || response.failure}${response.headers.get('location') ? ` → ${response.headers.get('location')}` : ''}`,
            )
        const parsed = parsePage(response.text)
        if (response.status === 200) checkPage(where, parsed, loc)
        if (alternates.length && parsed.alternates.length && alternatesKey(alternates) !== alternatesKey(parsed.alternates)) {
            warn(where, 'sitemap hreflang alternates differ from the page <link rel="alternate"> set')
        }
        return { loc, where, parsed, ok: response.status === 200 }
    })
    const okPages = pages.filter((page) => page.ok)
    checkHreflang(okPages)
    checkDuplicates(okPages, 'titles', 'title')
    checkDuplicates(okPages, 'descriptions', 'meta description')

    // Internal links (plus og:image) from every page: must resolve to 2xx.
    const linkSources = new Map()
    for (const page of okPages) {
        const targets = [...page.parsed.anchors, ...(page.parsed.ogImage ? [page.parsed.ogImage] : [])]
        for (const href of targets) {
            if (!href || href.startsWith('#') || /^(mailto|tel|javascript|data):/i.test(href)) continue
            let url
            try {
                url = new URL(href, page.loc)
            } catch {
                error(page.where, `unparseable link href "${href}"`)
                continue
            }
            if (!/^https?:$/.test(url.protocol) || !sameSite(url)) continue
            url.hash = ''
            const target = toBase(url.origin === base ? `${siteOrigin}${url.pathname}${url.search}` : url.href)
            if (!linkSources.has(target)) linkSources.set(target, new Set())
            linkSources.get(target).add(page.where)
        }
    }
    await mapLimit([...linkSources.keys()], FETCH_CONCURRENCY, async (target) => {
        const response = await get(target)
        const from = [...linkSources.get(target)].slice(0, 3).join(', ')
        if (response.status < 200 || response.status > 299)
            error(target, `broken internal link (HTTP ${response.status || response.failure}), linked from ${from}`)
        else if (response.redirected) warn(target, `internal link redirects to ${response.finalUrl}, linked from ${from}`)
    })

    await checkNotFound(base)

    console.log(`  crawled ${pages.length} sitemap URLs and ${linkSources.size} internal link targets`)

    if (args.lighthouse)
        await runLighthouse(
            okPages.map((page) => page.where),
            args,
        )

    return finish()
}

function finish() {
    const errors = issues.filter((issue) => issue.level === 'error')
    const warnings = issues.filter((issue) => issue.level === 'warn')
    for (const issue of [...errors, ...warnings]) {
        console.log(`${issue.level === 'error' ? '✗ ERROR' : '! warn '} ${issue.where}\n    ${issue.message}`)
    }
    console.log(`\n${errors.length} error(s), ${warnings.length} warning(s)`)
    process.exitCode = errors.length ? 1 : 0
}

main().catch((cause) => {
    console.error(`seo-check: ${cause instanceof Error ? cause.stack : cause}`)
    process.exit(1)
})
