# Production setup

Everything the site needs outside the code, step by step. Every service here is used on its free plan. Do the sections in order. Steps 1 to 4 are needed before the contact form works. Steps 5 and 6 can be done any time. Steps 7 to 9 only work once the new version is live on www.jandrly.cz, because the search engines check the live site.

Checklist:

- [ ] 0. Motion+ package token (builds fail without it)
- [ ] 1. Form token secret
- [ ] 2. Cloudflare Turnstile keys
- [ ] 3. Resend (email delivery)
- [ ] 4. Vercel environment variables and redeploy
- [ ] 5. Vercel Firewall rate limit rule
- [ ] 6. Upstash Redis (optional)
- [ ] 7. Google Search Console
- [ ] 8. Bing Webmaster Tools
- [ ] 9. Seznam Webmaster
- [ ] 10. Final check

Do not turn on anything that asks for a card. Specifically: Vercel BotID **Deep Analysis** is paid (Pro plan, $1 per 1,000 checks). The site uses BotID **Basic**, which is free and needs no setup.

## 0. Motion+ package token

The animations use the paid Motion+ package (`motion-plus`, installed from Motion's private npm registry as `@motionplus/core`). Every install needs a registry token, so without this step every Vercel build and the GitHub pull request check fail at `pnpm install` with `401 Unauthorized`. The repository is public: the token must never be committed. The committed side holds no secret: `.npmrc` has only the registry line, and `vercel.json` and `.github/workflows/seo.yml` reference the `MOTION_TOKEN` variable.

1. Sign in at https://motion.dev and open https://motion.dev/dashboard/tokens. Create a token (or copy the existing one). Don't paste it into chats, issues or files in the repository. The Motion AI kit sign-in (the website login used by the Motion MCP server) does not cover npm installs, so you need the token even if the MCP server works.
2. **Vercel:** project **Settings → Environment Variables → Add**: name `MOTION_TOKEN`, the token as value, **Sensitive** on, environments **Production** and **Preview**. `vercel.json` already sets the install command that uses it, so there is nothing else to configure. Redeploy afterwards.
3. **GitHub Actions:** repository **Settings → Secrets and variables → Actions → New repository secret**: name `MOTION_TOKEN`, the same token. The `SEO checks` workflow reads it. Pull requests from forks don't get repository secrets, so their check fails at install; your own branches work.
4. **Your computer:** store the token once in your user-level pnpm config (outside the repository):
    ```sh
    pnpm config set "//api.motion.dev/npm/:_authToken" "<token>"
    ```
    pnpm 11 refuses tokens written into the project's `.npmrc` through `${MOTION_TOKEN}`, which is why the token lives in the user config and why Vercel and CI run the same command before installing.

If the token is ever exposed (pasted somewhere public, committed), regenerate it on the tokens page and update steps 2 to 4.

## 1. Form token secret

The contact form signs a token with this secret. Without it the form refuses to run in production.

1. In a terminal, run:
    ```sh
    openssl rand -hex 32
    ```
2. Copy the 64-character output. You'll paste it into Vercel as `FORM_TOKEN_SECRET` in step 4. Don't reuse it anywhere else and don't commit it.

## 2. Cloudflare Turnstile keys

Turnstile is the invisible "are you human" check on the form.

1. Sign in at https://dash.cloudflare.com (create a free account if you don't have one; your domain does **not** need to be on Cloudflare).
2. In the sidebar open **Turnstile**, then **Add widget**.
3. Fill in:
    - **Widget name:** `jandrly.cz contact form`
    - **Hostnames:** `jandrly.cz` and `www.jandrly.cz`. Do **not** add `localhost`; local development uses Cloudflare's test keys, and a real key that accepts `localhost` lets anyone generate valid tokens from their own machine.
    - **Widget mode:** Managed.
    - Pre-clearance: leave off.
4. Select **Create**. Copy both values:
    - **Site key** → `VITE_TURNSTILE_SITE_KEY`
    - **Secret key** → `TURNSTILE_SECRET_KEY`

If you already have a widget for the old site, open it instead, check that the hostnames match the list above (remove `localhost` if present), and reuse its keys.

## 3. Resend (email delivery)

The form sends mail through Resend from `web@jandrly.cz`. The old site already used it, so this is mostly a check.

1. Sign in at https://resend.com.
2. **Domains:** `jandrly.cz` must show **Verified**. If it doesn't, open it and add the listed DNS records at forpsi.com (DNS management for the domain), then select **Verify DNS records**. The records are usually:
    - an MX record and an SPF TXT record on the `send` subdomain
    - a DKIM TXT record named `resend._domainkey`
3. Recommended, free: add a DMARC record at forpsi so nobody can send mail pretending to be your domain. Type TXT, name `_dmarc`, value:
    ```
    v=DMARC1; p=quarantine; adkim=r; aspf=r
    ```
4. **API Keys:** create a key with **Sending access** limited to `jandrly.cz`. Copy it → `RESEND_SEND`.

The privacy policy says Resend keeps copies of sent emails for at most 30 days. If you change plans or Resend changes retention, update `privacy_section_4_text` in `messages/cs.json` and `messages/en.json`.

## 4. Vercel environment variables and redeploy

1. Open https://vercel.com, select the project, then **Settings → Environment Variables**.
2. Add these for the **Production** environment. Mark the secrets as **Sensitive**.

    | Name                        | Value                                | Notes                                          |
    | --------------------------- | ------------------------------------ | ---------------------------------------------- |
    | `FORM_TOKEN_SECRET`         | from step 1                          | Sensitive                                      |
    | `TURNSTILE_SECRET_KEY`      | from step 2                          | Sensitive                                      |
    | `VITE_TURNSTILE_SITE_KEY`   | from step 2                          | Public, baked in at build time                 |
    | `RESEND_SEND`               | from step 3                          | Sensitive                                      |
    | `RESEND_FROM`               | `WEB \| jandrly.cz <web@jandrly.cz>` |                                                |
    | `RESEND_TO`                 | your inbox                           | Optional; defaults to the site owner's address |
    | `CONTACT_ALLOWED_HOSTNAMES` | `jandrly.cz,www.jandrly.cz`          | Optional; this is the default                  |

3. Make sure `CONTACT_DRY_RUN` is **not** set in Production. If it were `true`, the form would refuse to run (the code blocks dry-run mode in production).
4. Delete any leftover variables from the old site that no longer exist in `.env.example`.
5. Redeploy: **Deployments → the latest production deployment → ⋯ → Redeploy**. This is required because `VITE_` variables are read when the site is built, not when it runs.

Preview deployments: the form only works on hostnames listed in `CONTACT_ALLOWED_HOSTNAMES` and in the Turnstile widget. Previews show the form but reject submissions, which is fine. To test the form on a preview, add that preview's hostname to both temporarily.

## 5. Vercel Firewall rate limit rule

A second, edge-level limit on the form endpoint, on top of the one in the code. The Hobby plan allows one rate-limit rule per project, free.

1. In the project, open **Firewall** in the sidebar, then **Configure** (top right), then **+ New Rule**.
2. **Name:** `Contact form rate limit`.
3. **If** conditions (all must match):
    - **Request Path** · **Starts with** · `/_serverFn/`
    - **Method** · **Equals** · `POST`
4. **Then:** **Rate Limit**. If a pricing dialog appears the first time, it describes the included Hobby allowance; select **Continue**.
    - **Strategy:** Fixed Window
    - **Time Window:** 10 minutes (the Hobby maximum)
    - **Request Limit:** 10
    - **Key:** IP
    - **Action:** Deny
5. Select **Save Rule**, then **Review Changes → Publish**.
6. Optional: set the action to **Log** first, watch **Firewall → Traffic** for a few days, then switch to **Deny**.

BotID needs nothing here. Basic mode runs from the code on every plan.

## 6. Upstash Redis (optional)

Without Upstash, the code's rate limit (3 messages per hour per IP, 2 per day per email address) is kept in memory per server instance, so it resets whenever Vercel starts a new one. Upstash makes it shared and persistent. Skip this if the Vercel Firewall rule is enough for you.

1. Sign up at https://upstash.com (free plan, no card).
2. **Redis → Create Database.**
    - **Name:** `jandrly-ratelimit`
    - **Type/Region:** a single region in the EU, for example Frankfurt (`eu-central-1`).
    - **Plan:** Free.
3. Open the database and find the **REST API** section. Copy:
    - `UPSTASH_REDIS_REST_URL`
    - `UPSTASH_REDIS_REST_TOKEN` (Sensitive)
4. Add both to Vercel (step 4) and redeploy.

The privacy policy already lists Upstash, so no text change is needed either way.

## 7. Google Search Console

Tells Google the site exists and shows how it's indexed. Needs the new version live.

1. Open https://search.google.com/search-console and sign in with your Google account.
2. **Add property → URL prefix**, enter `https://www.jandrly.cz/`, **Continue**.
3. Choose **HTML tag**. Google shows a tag like `<meta name="google-site-verification" content="abc123…">`. Copy only the `content` value.
4. In Vercel, add `VITE_GOOGLE_SITE_VERIFICATION` = that value (Production), then redeploy (step 4.5).
5. Back in Search Console, select **Verify**. Keep the variable set afterwards; removing it un-verifies the site.
6. **Sitemaps** (sidebar): enter `sitemap.xml`, **Submit**. It should show **Success** and 10 discovered pages.
7. **URL inspection:** paste `https://www.jandrly.cz/` and `https://www.jandrly.cz/en/`, then **Request indexing** for each.

Alternative that covers every subdomain and both http and https: a **Domain** property verified with a DNS TXT record at forpsi.com. It works too, but then you manage the token in DNS instead of Vercel.

## 8. Bing Webmaster Tools

Bing also feeds DuckDuckGo, Ecosia and Yahoo. Do step 7 first; Bing can copy it.

1. Open https://www.bing.com/webmasters and sign in (a Google account works).
2. Choose **Import your sites from Google Search Console**, authorise, select `https://www.jandrly.cz/`, **Import**. The site is verified and its sitemap imported in one go.
3. If you'd rather add it manually: **Add a site** → `https://www.jandrly.cz/` → **HTML Meta Tag**. Copy the `content` value of `msvalidate.01`, set `VITE_BING_SITE_VERIFICATION` in Vercel, redeploy, then **Verify**. Submit `https://www.jandrly.cz/sitemap.xml` under **Sitemaps**.

After this, new and changed pages reach Bing automatically through IndexNow (see "What's already automatic").

## 9. Seznam Webmaster

Seznam still has a real share of Czech search.

1. Open https://webmaster.seznam.cz and sign in with a Seznam account (create one for free if needed).
2. Add the site `https://www.jandrly.cz`.
3. Choose verification by **meta tag**. Copy the `content` value of the `seznam-wmt` tag.
4. In Vercel, add `VITE_SEZNAM_SITE_VERIFICATION` = that value, redeploy, then confirm verification in Seznam Webmaster.
5. If Seznam Webmaster offers a sitemap field, submit `https://www.jandrly.cz/sitemap.xml`. Seznam also reads it from `robots.txt` and receives IndexNow pings.

## 10. Final check

After the last redeploy:

1. Open https://www.jandrly.cz/contact in a private window, wait a few seconds, and send yourself a real test message with a real email address. It should arrive in your inbox and appear in Resend under **Emails**.
2. In Vercel, **Logs**: filter for `contact_form`; the test should show `outcome: "sent"`.
3. Run the SEO check against production:
    ```sh
    pnpm seo:check https://www.jandrly.cz
    ```
    It should report 0 errors.
4. Open https://www.jandrly.cz/robots.txt and https://www.jandrly.cz/sitemap.xml; both should load.

## What's already automatic

Nothing to set up for these; they start working once this branch is merged to `main`.

- **IndexNow** (`.github/workflows/indexnow.yml`): after every successful Vercel **production** deployment, GitHub Actions sends all sitemap URLs to IndexNow, which forwards them to Bing, Seznam, Yandex and others. Needs Vercel's GitHub integration (it's on by default and creates the deployment events). The key file is `public/97ab3b77bbe19c6f38b7a7a57f8b4e2c.txt`. Manual run: `pnpm seo:indexnow` (add `--dry-run` to only print).
- **SEO check on pull requests** (`.github/workflows/seo.yml`): builds the site, runs lint, types and tests, then `seo:check` with Lighthouse. Free, because the repository is public.
- **Sitemap and robots.txt** are generated from the route list, so new pages appear automatically once added to `INDEXED_PAGES` in `src/lib/seo.ts`.
- **Google** has no free ping API; it finds updates through the sitemap listed in `robots.txt` and Search Console.

## Telling form spam from inbox spam

Every message from the form is sent by Resend, from `web@jandrly.cz`, with the subject "New portfolio contact request from …", and appears in Resend under **Emails**. If a spam email isn't in the Resend log, it was sent straight to your inbox by someone who scraped the address before this redesign hid it. The form can't stop that; use your mailbox's spam filter, or move to a new address or alias and retire the old one.

## If hosting changes

The privacy policy states Vercel Hobby's log retention (1 hour) and names Vercel, Cloudflare Turnstile, Resend and Upstash. If you move hosting or change plans, update `privacy_section_3_text` and `privacy_section_4_text` in both message files. BotID, Vercel Analytics and the Firewall rule are Vercel-only; everything else in the contact form works on any Node host.
