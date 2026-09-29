#!/usr/bin/env node
/**
 * IndexNow ping (https://www.indexnow.org). Free, no account: one POST notifies Bing, Seznam, Yandex, Naver,
 * Yep and the other participating engines that the site's URLs changed.
 *
 * The key is the 32-hex file in `public/` (`<key>.txt`, content = key). IndexNow keys are public by design:
 * the engines fetch `https://<host>/<key>.txt` to confirm the sender controls the host.
 *
 * Usage:
 *   pnpm seo:indexnow                          # submit every <loc> of https://www.jandrly.cz/sitemap.xml
 *   pnpm seo:indexnow --dry-run                # print the payload, send nothing
 *   pnpm seo:indexnow --base http://localhost:4200 --dry-run
 *                                              # read the sitemap from another server (URLs stay as listed)
 *
 * Exit codes: 0 = accepted (HTTP 200/202) or dry run, 1 = error.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ENDPOINT = 'https://api.indexnow.org/indexnow'
const DEFAULT_BASE = 'https://www.jandrly.cz'
const PUBLIC_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')
const KEY_FILE = /^([0-9a-f]{32})\.txt$/

function parseArgs(argv) {
    const args = { dryRun: false, base: DEFAULT_BASE }
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i]
        if (arg === '--dry-run') args.dryRun = true
        else if (arg === '--base') args.base = argv[++i]
        else if (arg.startsWith('--base=')) args.base = arg.slice('--base='.length)
        else if (arg === '--help' || arg === '-h') {
            console.log('Usage: node scripts/indexnow.mjs [--dry-run] [--base <url>]')
            process.exit(0)
        } else if (!arg.startsWith('-')) args.base = arg
        else throw new Error(`Unknown argument: ${arg}`)
    }
    if (!args.base) throw new Error('--base needs a URL')
    return args
}

function readKey() {
    const keys = readdirSync(PUBLIC_DIR).flatMap((name) => {
        const match = KEY_FILE.exec(name)
        return match && readFileSync(join(PUBLIC_DIR, name), 'utf8').trim() === match[1] ? [match[1]] : []
    })
    if (keys.length !== 1) throw new Error(`Expected exactly one IndexNow key file (public/<32 hex>.txt), found ${keys.length}`)
    return keys[0]
}

async function readSitemapUrls(base) {
    const sitemapUrl = new URL('/sitemap.xml', base).href
    const response = await fetch(sitemapUrl, { redirect: 'follow' })
    if (!response.ok) throw new Error(`${sitemapUrl} returned HTTP ${response.status}`)
    const xml = await response.text()
    const urls = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((match) => decodeXml(match[1]))
    if (urls.length === 0) throw new Error(`${sitemapUrl} lists no <loc> URLs`)
    return [...new Set(urls)]
}

function decodeXml(value) {
    return value
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>')
        .replaceAll('&quot;', '"')
        .replaceAll('&apos;', "'")
        .replaceAll('&amp;', '&')
}

async function main() {
    const args = parseArgs(process.argv.slice(2))
    const key = readKey()
    const urlList = await readSitemapUrls(args.base)

    // IndexNow requires every URL to share the host of `keyLocation`; the sitemap lists canonical URLs only.
    const host = new URL(urlList[0]).host
    const foreign = urlList.filter((url) => new URL(url).host !== host)
    if (foreign.length > 0) throw new Error(`Sitemap mixes hosts (${host} vs ${foreign.join(', ')})`)

    const payload = { host, key, keyLocation: `https://${host}/${key}.txt`, urlList }

    if (args.dryRun) {
        console.log(`[dry run] POST ${ENDPOINT}`)
        console.log(JSON.stringify(payload, null, 2))
        return
    }

    const keyCheck = await fetch(payload.keyLocation)
    const keyBody = keyCheck.ok ? (await keyCheck.text()).trim() : ''
    if (keyBody !== key) throw new Error(`${payload.keyLocation} does not serve the key (HTTP ${keyCheck.status}); deploy it first`)

    const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
    })
    const body = await response.text()
    // 200 = submitted, 202 = accepted, key validation pending. Everything else (400/403/422/429) is an error.
    if (response.status !== 200 && response.status !== 202) {
        throw new Error(`IndexNow answered HTTP ${response.status}: ${body.slice(0, 500)}`)
    }
    console.log(`IndexNow accepted ${urlList.length} URLs for ${host} (HTTP ${response.status}).`)
}

main().catch((error) => {
    console.error(`indexnow: ${error instanceof Error ? error.message : error}`)
    process.exit(1)
})
