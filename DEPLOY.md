# Deploying documently.in

Static Next.js export (`out/`) + Cloudflare Pages Functions (`functions/`) + one D1 database for anonymous usage events.
Everything below is free-tier.

## 0. Before you start

- Node 22, a GitHub account, a Cloudflare account, and the documently.in registrar login.
- Local check: `npm ci && node scripts/validate-presets.mjs && npm run build` must pass (the build runs `scripts/postbuild.mjs`: link checker, h1/title/description/canonical/OG checks, JSON-LD parse, sitemap sanity).

## 1. GitHub

```bash
gh repo create documently.in --public --source . --remote origin --push
```

CI (`.github/workflows/ci.yml`) runs lint, preset validation, functions type-check and the full build on every push/PR.

## 2. D1 database (usage events)

```bash
npx wrangler login
npx wrangler d1 create documently          # copy the printed database_id into wrangler.toml
npx wrangler d1 execute documently --remote --file db/schema.sql
```

Commit the updated `wrangler.toml`. See `db/README.md` for the 13-month retention prune command.

## 3. Cloudflare Pages project

1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git** → pick the repo.
2. Framework preset: **None**. Build command: `npm run build`. Build output directory: `out`. Root: `/`.
3. **Settings → Variables and Secrets** (Production *and* Preview):
   - `NODE_VERSION` = `22`
   - `NEXT_PUBLIC_GA_ID` = `G-…` (after step 9; redeploy once set)
   - `NEXT_PUBLIC_TRACKING_DISABLED` = `1` on **Preview** only, if you don't want preview traffic in stats
   - `ADMIN_TOKEN` → **Encrypt** (secret). Generate with `openssl rand -hex 24` (min 16 chars).
4. **Settings → Bindings → Add → D1 database**: variable name `DB`, database `documently` (Production and Preview).
5. Save and **Retry deployment** so the binding and variables apply. The `functions/` folder is detected automatically.
6. Smoke test on the `*.pages.dev` URL:
   - every tool page loads; `/sitemap.xml`, `/robots.txt`, `/llms.txt`, `/manifest.webmanifest` load
   - open `/admin/`, paste the token → KPI tiles load (zeros are fine)

## 4. Local API testing

```bash
npm run build
echo "ADMIN_TOKEN=local-dev-token-123456" > .dev.vars        # .dev.vars and .wrangler/ are git-ignored
npx wrangler d1 execute documently --local --file db/schema.sql
npx wrangler pages dev out     # http://localhost:8788 — uses the DB binding from wrangler.toml (do NOT add --d1, it points at a different, empty local DB)
```

```bash
curl -i -X POST http://localhost:8788/api/track -H 'origin: http://localhost:8788' \
  -H 'content-type: application/json' \
  -d '{"tool":"compress-pdf","action":"success","session":"testsession01","inBytes":512000,"outBytes":98000,"durationMs":2300}'
curl -s 'http://localhost:8788/api/stats?days=7' -H 'authorization: Bearer local-dev-token-123456'
```

## 5. Custom domain + DNS

1. Cloudflare → **Add a site** → `documently.in` (Free plan). Copy the two nameservers.
2. At the registrar, replace the nameservers with Cloudflare's. Wait for “Active” (minutes to a few hours).
3. Pages project → **Custom domains** → add `documently.in`, then add `www.documently.in`.
4. **www → apex redirect** (pick one):
   - **Bulk Redirects** (recommended): Account → Bulk Redirects → create list with
     `www.documently.in` → `https://documently.in`, status 301, enable *Preserve query string*, *Subpath matching*,
     *Preserve path suffix*; then create a Bulk Redirect rule using that list.
   - or **Rules → Redirect Rules**: when hostname equals `www.documently.in` → dynamic
     `concat("https://documently.in", http.request.uri.path)`, 301, preserve query string.
5. **SSL/TLS** → mode *Full*; **Edge Certificates** → *Always Use HTTPS* on, *Automatic HTTPS Rewrites* on, minimum TLS 1.2.
6. **Speed → Optimization** → Brotli is on by default on Cloudflare; confirm it. Leave caching at defaults.
7. No CORS setup needed: the tracking endpoint only accepts requests from
   `documently.in`, `www.documently.in`, `*.documently.pages.dev` and `localhost`.

## 6. Email: hello@documently.in

Cloudflare → documently.in → **Email → Email Routing** → enable (it adds MX + SPF records) → create address
`hello@documently.in` → forward to your Gmail → verify the destination. To reply *as* hello@, add it in Gmail
“Send mail as” via an SMTP provider later; receiving works immediately.

## 7. Google Search Console

1. search.google.com/search-console → **Add property → Domain** → `documently.in`.
2. Copy the TXT record → Cloudflare DNS → add `TXT @ google-site-verification=…` → Verify.
3. **Sitemaps** → submit `https://documently.in/sitemap.xml`.
4. **URL Inspection** → request indexing for the homepage, each tool page and the Tier A preset pages.

## 8. Bing Webmaster Tools (also powers Copilot, ChatGPT search and DuckDuckGo)

1. bing.com/webmasters → **Import from Google Search Console** (pulls the site + sitemap in one click).
2. Confirm `https://documently.in/sitemap.xml` shows under Sitemaps.
3. Enable **IndexNow** pings (section 10). Bing’s index feeds Microsoft Copilot and much of ChatGPT search, so this
   step matters for AI answers, not just Bing.

## 9. Google Analytics 4

1. analytics.google.com → create property “documently.in”, time zone India, currency INR → Web stream for
   `https://documently.in`.
2. Copy the Measurement ID (`G-…`) into Pages → Variables → `NEXT_PUBLIC_GA_ID` → redeploy.
3. Admin → Data retention → 14 months (matches the privacy policy).
4. Custom events arrive as `tool_view`, `tool_start`, `tool_success`, `tool_error`, `tool_download`
   (params: tool, preset, in_bytes, out_bytes, file_count, duration_ms). Register `tool` and `preset` as
   custom dimensions to slice reports by them.
5. Consent Mode v2 defaults are already set in `components/Analytics.tsx` (analytics granted, ads denied).

## 10. IndexNow (Bing, Yandex, Seznam, Naver)

One-time: generate a key, publish it, store it.

```bash
KEY=$(node -e "console.log(crypto.randomUUID().replace(/-/g,''))")
echo -n "$KEY" > public/$KEY.txt   # commit + deploy so https://documently.in/$KEY.txt returns the key
```

After each deploy that adds or changes pages:

```bash
npm run build
INDEXNOW_KEY=$KEY node scripts/indexnow.mjs --dry-run   # preview
INDEXNOW_KEY=$KEY node scripts/indexnow.mjs             # submits every sitemap URL
```

## 11. AI search visibility

- `robots.txt` explicitly allows Googlebot, Bingbot, GPTBot, ChatGPT-User, OAI-SearchBot, PerplexityBot, ClaudeBot,
  Claude-SearchBot, anthropic-ai, Google-Extended and Applebot-Extended (and `*`), and blocks only `/admin/` and `/api/`.
- `/llms.txt` lists every tool and verified preset with its key spec — a clean summary for LLM crawlers.
- **Cloudflare → Security → Bots / AI Crawl Control**: make sure “Block AI bots” is **off**, or the robots.txt
  allowances above are overridden at the edge.
- **Brave Search** (used by Claude’s web search): submit the site at search.brave.com/help/webmaster (or wait for
  organic discovery; Brave has no sitemap console). Check with `site:documently.in` on search.brave.com.
- **Perplexity**: crawls on its own via PerplexityBot (allowed); nothing to submit.
- ChatGPT search relies on Bing’s index plus OAI-SearchBot → step 8 covers it.

## 12. AdSense (later)

Apply when there are ~25–30 quality pages, 2–4 weeks of indexing and some organic traffic (PLAN.md §10).

1. adsense.google.com → add site `documently.in` → paste the verification snippet via `NEXT_PUBLIC_ADSENSE_ID`.
2. **Privacy & messaging → European regulations** → create the Google-certified consent message (EEA/UK/CH).
   The privacy policy already describes it.
3. After approval, create `public/ads.txt` with:
   `google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0` → commit → deploy → check `https://documently.in/ads.txt`.
4. Manual ad units only (no Auto Ads), never next to upload/download buttons.

## 13. After every deploy

- `/admin/` → check errors table for new failures.
- Search Console → Pages report for indexing issues.
- Run IndexNow (section 10) if pages changed.
