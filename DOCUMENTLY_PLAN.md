# documently.in — Master Build & Growth Plan

> **How to use:** Create an empty folder, open it in your terminal, start Claude Code (`claude`), and paste the section **"PROMPT 1 — BUILD TONIGHT"**. When the site is live, set up **"PROMPT 2 — SEO AGENT"** as a recurring job. Everything else in this file is reference for both agents. Keep this file in the repo root as `PLAN.md` so agents always read it.

---

## 0. North Star

**Positioning:** *"Free PDF & photo tools for every Indian form."*
Win the long tail that the giants ignore: exact-size, exact-format needs for Indian exams, government forms and IDs (e.g. "compress pdf to 100kb", "photo 20kb for SSC form", "signature resize for NEET").

**Tonight's goal:** A live, fast, original-design site on documently.in with 10 working tools, exam/form preset pages, legal pages, sitemap, and Search Console submitted.

**90-day goal:** 60+ indexed pages, AdSense approved, 1 lakh+ monthly pageviews.

---

## 1. Non-Negotiables (both agents must follow)

1. **Original UI, copy, and code.** Don't scrape or copy any competitor's design, text, icons or code. You can study their *tool list* and *user flow*, but all design and wording must be ours.
2. **No false claims.** Don't say "AI-powered compression." Only use the word AI for features that actually use AI (later: Chat with PDF, Summarize).
3. **Files stay in the browser.** All MVP processing happens client-side in the browser (WASM/JS), so "Your files never leave your device" is true. Use no upload server in the MVP.
4. **Verified presets only.** Every exam or form size limit must come from the official notification or portal, with its `sourceUrl` and `verifiedOn` date stored. If you can't verify a limit, don't publish that page.
5. **No thin or mass-generated pages.** Each page must solve a real, distinct need with useful, specific content. Quality beats volume, because Google's scaled-content policy and AdSense "low value content" rejections punish volume.
6. **Fast.** Aim for a Lighthouse score of 90+ on mobile. Most Indian users are on mobile and 4G.

---

## 2. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router) with static export** | SEO-friendly static HTML and file-based pages |
| Styling | Tailwind CSS | Fast, small CSS |
| Hosting | **Cloudflare Pages** (free) | Global CDN, free, easy custom domain |
| PDF ops | `pdf-lib` (merge/split/rotate/JPG→PDF), `pdfjs-dist` (PDF→JPG, preview), Ghostscript WASM (real PDF compression) | All client-side |
| Image ops | `browser-image-compression` + Canvas API | Compress and resize to a target KB |
| Video (Phase 2) | `ffmpeg.wasm` | Small files only, client-side |
| Analytics | GA4 + Search Console (+ Bing Webmaster) | Free |
| Ads | Google AdSense (after approval) | `ads.txt` at root |
| Repo | GitHub (private) | Needed for the SEO agent and CI |

**Heavy work runs in Web Workers so the UI never freezes. Load WASM lazily, only on the tool page that needs it.**

---

## 3. Repo Structure

```
/app
  /page.tsx                      → Homepage (tool grid + top exam presets)
  /[tool]/page.tsx               → Generic tool pages (compress-pdf, merge-pdf…)
  /[tool]/[preset]/page.tsx      → Long-tail preset pages (compress-pdf-to-100kb, ssc-photo-resize…)
  /guides/[slug]/page.tsx        → How-to guides (MDX)
  /about, /privacy, /terms, /contact, /disclaimer
/components                      → Dropzone, ToolShell, ResultCard, PresetChips, FAQ, AdSlot, RelatedTools
/lib/tools                       → One module per tool (pure functions + worker)
/data/tools.json                 → Tool registry (slug, title, description, category)
/data/presets.json               → Exam/form presets (verified specs)
/content/guides/*.mdx            → Guide articles
/public/ads.txt, robots.txt
/scripts                         → sitemap generation, link checker, preset validator
PLAN.md                          → This file
SEO_LOG.md                       → Agent's running log of changes
```

### Preset schema (`/data/presets.json`)
```json
{
  "slug": "ssc-cgl-photo",
  "tool": "resize-image",
  "title": "SSC CGL Photo Resize",
  "authority": "Staff Selection Commission",
  "spec": { "minKB": 0, "maxKB": 0, "widthPx": 0, "heightPx": 0, "format": "jpg", "dpi": null },
  "sourceUrl": "https://… (official notification/portal)",
  "verifiedOn": "YYYY-MM-DD",
  "faqs": [{ "q": "", "a": "" }],
  "status": "verified | needs-review"
}
```
Only presets with `"status": "verified"` are built into pages.

---

## 4. Tools — Priority Order (traction first)

### Tonight (MVP, P0)
| # | Tool | Slug | Why first |
|---|---|---|---|
| 1 | Compress PDF (incl. target size: 100KB / 200KB / 500KB / 1MB) | `/compress-pdf` | Highest-volume need; "to 100kb" variants are huge in India |
| 2 | Compress Image to target KB (10/20/50/100/200KB) | `/compress-image` | Exam forms |
| 3 | Resize Image (px + KB together, with presets) | `/resize-image` | Exam forms |
| 4 | Photo + Signature for Exam Forms (crop, resize, KB, DPI) | `/exam-photo-signature` | **Our wedge** |
| 5 | JPG/PNG → PDF | `/jpg-to-pdf` | Document uploads |
| 6 | PDF → JPG | `/pdf-to-jpg` | Common |
| 7 | Merge PDF | `/merge-pdf` | Common |
| 8 | Split / Extract pages | `/split-pdf` | Common |
| 9 | Rotate PDF | `/rotate-pdf` | Easy win |
| 10 | Crop Image | `/crop-image` | Supports photo needs |

### Week 2 (P1)
Convert image formats (HEIC/WebP→JPG), Remove PDF password (user-owned files only), Add page numbers, Watermark, Organize pages, Compress Video (small files, ffmpeg.wasm), Passport photo maker (fixed sizes, print sheet).

### Week 3–4 (P2)
Word→PDF / PDF→Word (needs a server or API, so evaluate the cost first), OCR (Tesseract.js), **Chat with PDF / Summarize PDF (real AI)**, Hindi UI.

---

## 5. Page Template (every tool & preset page)

1. **H1** = the exact search intent (e.g. "Compress PDF to 100KB").
2. **The tool sits above the fold** on mobile: dropzone, preset chips, then the action button.
3. Trust line: "Free · No signup · Files never leave your device."
4. **Result card:** before/after size, download button, and a "Do another" button. *(Ad slot goes here, below the result, never next to the upload or download buttons.)*
5. **"How to" steps** (3–5 steps, with HowTo schema).
6. **Spec box** (preset pages): the official requirement, a source link, and the "verified on" date.
7. **Useful content** (300–600 words): common rejection reasons, tips, and mistakes to avoid. It must be specific, not filler.
8. **FAQ** (4–6 Q&As, with FAQPage schema).
9. **Related tools and presets** (internal links).
10. Breadcrumbs (with BreadcrumbList schema).

**Metadata:** a unique title (under 60 chars), meta description (under 155 chars), canonical URL, OpenGraph tags, and `WebApplication` schema on tool pages.

---

## 6. SEO Page Matrix (build order)

**Tier A — tonight / week 1 (highest traction):**
- `/compress-pdf/to-100kb`, `/to-200kb`, `/to-500kb`, `/to-1mb`, `/to-50kb`
- `/compress-image/to-20kb`, `/to-50kb`, `/to-100kb`, `/to-10kb`
- `/resize-image/passport-size-photo`, `/signature-resize`
- `/exam-photo-signature/{exam}` for the top exams **once their specs are verified**: SSC (CGL/CHSL/GD), UPSC, NEET, JEE Main, CUET, IBPS/SBI, RRB, state PSCs (UPPSC, MPSC, BPSC)

**Tier B — weeks 2–4:**
- ID and gov uploads: PAN, passport (Passport Seva), DigiLocker, scholarship portals, college admissions, job portals
- Format pages: `/heic-to-jpg`, `/webp-to-jpg`, `/png-to-pdf`
- Guides: "Why your photo gets rejected in SSC form," "How to reduce PDF size on mobile," and similar

**Tier C — month 2+:** Hindi versions (`/hi/...`) of the Tier A pages, plus state-exam presets.

---

## 7. Technical SEO Checklist

- [ ] `sitemap.xml` auto-generated at build; `robots.txt` points to it
- [ ] Canonical tags on every page; no duplicate preset pages
- [ ] Schema: WebApplication, HowTo, FAQPage, BreadcrumbList, Organization
- [ ] Core Web Vitals: lazy-load WASM, preload fonts or use system fonts, no layout shift from ads (reserve ad slot height)
- [ ] Clean URLs, lowercase, hyphenated
- [ ] Internal linking: homepage → tools → presets → guides → back
- [ ] 404 page with the tool grid
- [ ] OG images per tool (generated at build)
- [ ] PWA manifest (installable from the "Add to Home Screen" prompt, which helps repeat traffic)
- [ ] IndexNow ping on deploy (Bing/Yandex)

---

## 8. Legal & Trust (needed for AdSense)

About (who runs it, why), Privacy Policy (including client-side processing, analytics, AdSense cookies, and a Google consent message for EEA/UK visitors), Terms, Contact (real email: hello@documently.in), Disclaimer ("not affiliated with any exam authority; always verify with the official notification").

---

## 9. Deploy Tonight (step by step)

1. Create a GitHub repo and push the code.
2. In Cloudflare Pages, connect the repo. Build command: `npm run build`. Output: `out/`.
3. In Cloudflare, add documently.in as a custom domain. Update nameservers at your registrar to Cloudflare's, then add `www` and redirect it to the apex domain.
4. Enforce HTTPS and turn on Brotli. Leave caching at the defaults.
5. In Google Search Console, add a Domain property (DNS TXT record via Cloudflare) and submit `sitemap.xml`. Request indexing for the homepage and the Tier A pages.
6. In Bing Webmaster Tools, import from Search Console.
7. Add GA4.
8. Set up `hello@documently.in` (free option: Cloudflare Email Routing forwarding to your Gmail).

---

## 10. AdSense Plan

- **Apply** once there are about 25–30 quality pages, 2–4 weeks of indexing, and some organic traffic. Add `ads.txt` after approval.
- **If rejected for "low value content":** add depth to guides and presets, fix navigation, wait 2–3 weeks, and reapply. This rejection is common for tool sites, so don't panic.
- **Placements:** below the result card, inside the content after the "How to" section, and in the sidebar on desktop. **Never next to the upload or download buttons** (accidental clicks get accounts banned).
- Don't use Auto Ads at the start. Use manual slots with reserved height to protect Core Web Vitals.
- **Later:** add Ezoic or Mediavine-style networks once traffic grows, and a paid "Pro" tier (no ads, batch processing).

---

## 11. Traction Plan (top priority, run in parallel with the build)

| Priority | Channel | Action |
|---|---|---|
| 🔥 1 | **Exam calendar timing** | Publish and refresh presets 2–3 weeks before each form window opens (SSC, NEET, JEE, UPSC, banking). Traffic spikes around those deadlines. |
| 🔥 2 | **Long-tail pages** | Ship Tier A pages fast and verified. This is the core engine. |
| 🔥 3 | **Telegram/WhatsApp exam groups** | Share the exact tool link when a form opens ("SSC CGL photo 20–50KB in one click"). Be helpful, not spammy. |
| 🔥 4 | **Quora / Reddit (r/Indian_Academia, exam subs)** | Answer real "photo rejected / size too big" questions with steps plus the link. |
| 5 | **YouTube Shorts / Instagram Reels** | 20-second screen recordings: "Reduce PDF to 100KB on your phone." One per top preset. |
| 6 | **Coaching institutes and edu bloggers** | Offer a free embeddable widget or link. Backlinks from .edu.in and coaching sites carry SEO weight. |
| 7 | **Your D2C Insider / LinkedIn reach** | A build-in-public post brings early backlinks and feedback. |
| 8 | **PWA + bookmark prompt** | Bring repeat users back without paying for Google traffic again. |
| 9 | **Hindi pages** | Cover high-volume, low-competition Hindi queries. |

---

## PROMPT 1 — BUILD TONIGHT (paste into Claude Code)

```
You are building documently.in, a free, fast, mobile-first PDF & image tools website for Indian users. Read PLAN.md fully first and follow its Non-Negotiables strictly.

Goal for this session: a production-ready MVP deployed as a static Next.js export to Cloudflare Pages.

Do this in order, committing after each step:
1. Scaffold Next.js (App Router, TypeScript, Tailwind, static export). Create the repo structure from PLAN.md §3.
2. Design: an original, clean, trustworthy design system (one brand color, system fonts, large tap targets). Homepage: hero line "Free PDF & photo tools for every Indian form", search box, tool grid, a "Popular exam presets" row, and a trust strip. Do NOT copy any competitor's design or text.
3. Build reusable components: Dropzone (drag/drop + mobile picker), ToolShell, PresetChips, ResultCard (before/after size, download, reset), FAQ (with schema), RelatedTools, AdSlot (renders a reserved-height placeholder until AdSense is enabled via env var), Breadcrumbs.
4. Implement the P0 tools from PLAN.md §4, all client-side, in Web Workers:
   - compress-pdf: Ghostscript WASM with quality levels + "target size" mode (iterate settings until under the target or report the best achievable size)
   - compress-image: binary-search JPEG quality (and downscale if needed) to hit a target KB
   - resize-image: px + KB + DPI together
   - exam-photo-signature: crop (with aspect lock) → resize → compress to KB range, preset-driven
   - jpg-to-pdf, pdf-to-jpg (pdfjs-dist), merge-pdf, split-pdf, rotate-pdf, crop-image
   Lazy-load heavy libraries only on their own page. Handle errors gracefully (password-protected PDFs, huge files, unsupported formats).
5. Build data-driven pages from /data/tools.json and /data/presets.json using the template in PLAN.md §5. Create the Tier A size pages (compress-pdf to 50/100/200/500KB/1MB, compress-image to 10/20/50/100KB, passport-size photo, signature resize). For exam presets: research the CURRENT official notification for each Tier A exam, fill spec + sourceUrl + verifiedOn, and set status "verified" ONLY if you found the official source. Otherwise set "needs-review" and do not publish it. List anything unverified in SEO_LOG.md.
6. Write original, specific, useful content for each page (how-to, rejection reasons, tips, FAQs). No filler, no keyword stuffing, no claims of AI.
7. Add About, Privacy, Terms, Contact, Disclaimer pages (PLAN.md §8). Contact email: hello@documently.in.
8. Technical SEO from PLAN.md §7: metadata, canonicals, all schema types, sitemap.xml, robots.txt, OG images, PWA manifest, 404 page.
9. Test every tool with real sample files (create test fixtures). Run Lighthouse on mobile and fix issues until performance ≥ 90 and SEO = 100 on key pages. Run a link checker.
10. Add a GitHub Actions workflow for build checks. Write DEPLOY.md with the exact Cloudflare Pages + DNS + Search Console steps from PLAN.md §9.
11. Final report: list of live URLs, tools tested, Lighthouse scores, unverified presets, and what I must do manually (DNS, Search Console, GA4).

Work autonomously; ask me only for things that need my accounts.
```

---

## PROMPT 2 — SEO & GROWTH AGENT (recurring)

**How to run it:** Either
- **(a)** use GitHub Actions on a weekly cron (e.g. Monday 6 AM IST) running Claude Code headless (`anthropics/claude-code-action`, or `claude -p` with `ANTHROPIC_API_KEY` stored as a repo secret), **or**
- **(b)** set up a scheduled task in Claude that runs this prompt against the repo.

**Rule:** the agent opens a **Pull Request** and never pushes directly to main. You review and merge. A merge auto-deploys via Cloudflare.

```
You are the SEO & growth agent for documently.in. Read PLAN.md (especially Non-Negotiables) and SEO_LOG.md first. Work on a new branch and open a Pull Request; never push to main.

Each run:
1. EXAM CALENDAR: Check official sites/notifications for Indian exams and govt forms opening in the next 30 days. For each, create or refresh a preset in /data/presets.json with the verified spec, sourceUrl and today's verifiedOn date. If a spec changed, update it and note it prominently in the PR.
2. NEW PAGES (max 5 per run, quality over quantity): Pick the highest-value missing long-tail intents from PLAN.md §6 and the exam calendar. Each page must be genuinely distinct and useful, with verified specs and original content. Skip anything you cannot verify.
3. REFRESH: Improve 3 existing pages: clearer steps, better FAQs from real user questions (search Quora/Reddit for phrasing), internal links, and an updated "verified on" date only if re-verified.
4. TECHNICAL: Run build, link checker, schema validation, and a Lighthouse audit on 5 key pages. Fix regressions.
5. SEARCH CONSOLE (if data is provided in /reports or via API): find pages with high impressions but low CTR → improve title/meta; find queries we rank 8–20 for → strengthen those pages.
6. TRACTION KIT: For each new or updated exam preset, draft (don't post) one Telegram/WhatsApp message, one Quora answer outline, and one 20-sec Reel script into /growth/drafts/YYYY-MM-DD.md.
7. LOG: Append a dated summary to SEO_LOG.md: what changed, what needs human review, and metrics.

Hard rules: no copied competitor content, no false AI claims, no unverified exam specs, no bulk thin pages, no keyword stuffing, and ad slots never next to upload/download buttons.
```

---

## 12. Milestones & KPIs

| When | Milestone | KPI |
|---|---|---|
| Tonight | MVP live, sitemap submitted | 10 tools working, Lighthouse ≥90 |
| Week 1 | All Tier A pages live | 25+ pages indexed |
| Week 2 | P1 tools, SEO agent running weekly | First organic clicks |
| Week 3–4 | Apply for AdSense | 30+ quality pages |
| Month 2 | Hindi pages, Tier B pages | 10k+ monthly visits |
| Month 3 | AdSense earning, Chat with PDF (real AI) | 1L+ pageviews/month |

**Revenue math:** India tech/education RPM is roughly ₹165–415. At about ₹250 RPM, ₹1 lakh a month needs about 4 lakh pageviews.

---

## 13. Tonight's Personal Checklist (things only you can do)

- [ ] Point documently.in nameservers to Cloudflare
- [ ] Create GitHub repo + Cloudflare account
- [ ] Verify domain in Google Search Console; submit sitemap
- [ ] Create GA4 property and paste the ID into `.env`
- [ ] Set up hello@documently.in email forwarding
- [ ] Optional: buy documentally.in (typo protection)
- [ ] Draft the LinkedIn build-in-public post
