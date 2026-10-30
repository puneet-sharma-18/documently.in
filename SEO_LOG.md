# SEO & Content Log

Running log for documently.in. The SEO agent (PLAN.md, Prompt 2) appends a dated entry each run.

---

## 2026-10-31 — MVP build

### Live pages (36 HTML pages in the build)
- **10 tools:** compress-pdf, compress-image, resize-image, exam-photo-signature, jpg-to-pdf, pdf-to-jpg, merge-pdf, split-pdf, rotate-pdf, crop-image
- **Size presets (11):**
  - compress-pdf to 50 / 100 / 200 / 500 KB and 1 MB
  - compress-image to 10 / 20 / 50 / 100 KB
  - resize-image passport-size-photo and signature-resize
- **Exam presets (5), all verified against official notices on 2026-10-30:**

| Page | Source |
|---|---|
| /exam-photo-signature/ssc-cgl/ | SSC CGL 2026 notice, paras 9.3–9.6 (photo is captured live; only the signature is uploaded) |
| /exam-photo-signature/neet-ug/ | NEET (UG) 2026 Information Bulletin, Chapter 3 |
| /exam-photo-signature/jee-main/ | JEE (Main) 2027 Information Bulletin (released 24 Oct 2026) |
| /exam-photo-signature/upsc-cse/ | CSE 2026 Notice 05/2026-CSE + the upsconline photo/signature instructions |
| /exam-photo-signature/ibps-po/ | CRP PO/MT-XVI notification (30 Jun 2026), Annexure III |

- **Trust pages:** about, privacy, terms, contact, disclaimer, 404
- **Machine-readable:** sitemap.xml, robots.txt (AI crawlers explicitly allowed), llms.txt, manifest

### SEO / GEO / AEO applied
- **Every tool and preset page has:**
  - an answer-first summary under the H1
  - a HowTo with steps
  - 4–6 FAQs, with FAQPage schema
  - WebApplication, BreadcrumbList and HowTo schema
  - a canonical URL, OG/Twitter cards and a "Last updated" date
- **Exam pages** add an official spec table with a cited source link and a "verified on" date.
- **Site-wide:** Organization and WebSite schema.
- **Lighthouse (mobile, local):**
  - Performance 96–99
  - Accessibility 100
  - Best Practices 96–100 (the only miss is a local-only 404 from `/api/track`)
  - SEO 100

### Needs human review / not published
- **NEET UG finger & thumb impressions:** the 2026 bulletin contradicts itself (10–200 KB on p.16 vs 50–300 KB on p.17). No preset is published; the NEET page tells users to follow the size shown on the form.
- **UPSC instruction PDF:** `upsconline.nic.in/ngrp/assets/PDF/instruction-photo-signature-upload-upsc.pdf` now returns 404. Specs were read from the Wayback snapshot of 2026-07-29. Re-verify when the CSE 2027 notice is out (expected Jan/Feb 2027).
- **SSC CGL:** many sites still quote "photo 20–50 KB, 3.5×4.5 cm", but this is not in the 2026 notice. Our page says so explicitly.
- **NEET UG 2027 bulletin:** not yet released. Update the NEET page when it is.
- **Not yet built (Tier A from PLAN.md §6):**
  - CHSL / GD presets
  - CUET, SBI, RRB and the state PSCs (UPPSC, MPSC, BPSC)

### Next run should
1. Verify CUET UG 2027, SSC CHSL/GD and SBI PO when their notices open, and add exam presets.
2. Re-check JEE Main 2027 for any corrigendum before the form window closes.
3. Add guides: "Why your exam photo gets rejected" and "How to reduce PDF size on mobile".

---

## 2026-10-31 — AEO pass (all 10 tool pages + 16 preset pages)

### Scores (citability_scorer.py on `out/`)
- **Site average:** 39.6 → 41.2 (34 pages). Tool + preset pages only: 40.0 → 42.2 (26 pages).
- **New Key facts blocks** score 64–79 each as single passages (most pages had no 134–167-word passage before; now every tool/preset page has at least one).
- **Worst five after:** contact 31.2, terms 33.1, home 33.8, 404 34.3, _not-found 34.3 (all out of scope, not data-driven).
- **Worst five data-driven pages after:** ibps-po 36.0 (was 35.1), resize-image 37.5 (34.1), compress-image/to-20kb 39.1 (37.0), resize-image/signature-resize 39.2 (36.7), resize-image/passport-size-photo 39.5 (37.6). These stay low because the spec rules, bullet lists and short FAQs are scored as many short blocks; they are useful as written and were not padded.
- Tables: `growth/aeo/citability-2026-10-31-before.txt`, `growth/aeo/citability-2026-10-31-after.txt`.
- **Pre-flight:** `out/robots.txt` allows GPTBot, OAI-SearchBot, ChatGPT-User, PerplexityBot, ClaudeBot, Claude-SearchBot, Google-Extended and Bingbot. `out/llms.txt` lists all 26 tool/preset pages plus the trust pages.

### What changed (data/tools.json, data/presets.json; content fields only)
- **`keyFacts` added to all 26 pages:** one distinct 146–166-word passage per page. Each one names the tool and task, gives the exact sizes, pixels or DPI, and explains in-browser processing with no upload. Each ends with the action to take.
  - **Exam pages:** each cites its official notice by name and gives the verified-on date (30 Oct 2026).
  - **Size presets:** each quotes the first-party test table as "in our tests".
  - **Arithmetic is shown:** cm ÷ 2.54 × DPI, 100 × 1,024 = 102,400, 1 ÷ 20 = 5%.
- **`answer` rewritten on 10 pages to carry a measured number, all ≤ 45 words:** compress-pdf, compress-image, resize-image, pdf-to-jpg, PDF to 100 KB / 200 KB / 500 KB / 1 MB, image to 10 KB, and passport-size-photo.
  - **PDF to 500 KB:** the old answer said "most scanned documents of up to around 15–20 pages can reach 500 KB". No test supported that, so it was replaced with the measured 5.16 MB → 284 KB.
- **FAQs:**
  - **Answer-first rewrites (8):**
    - PDF to 50 KB "without losing quality"
    - PDF to 1 MB: the "10 MB to 1 MB" FAQ (replaced the unsupported "usually in under a minute" with the measured 3.7 s) and the "without losing quality" FAQ
    - PDF to 200 KB "5 MB to 200 KB" (now quotes the measured 154 KB)
    - crop-image quality
    - jpg-to-pdf smaller file
    - merge-pdf adding JPGs
    - rotate-pdf mixed directions
    - UPSC spectacles
  - **Question rephrasing (7):** pdf-to-jpg page limit, image to 10 KB portal count, passport "stretch my face", signature "pixels or cm", NEET postcard photo, JEE 2027 bulletin, jpg-to-pdf smaller file.
  - **Hinglish questions (2):** "PDF ko 100 KB kaise kare on mobile?" (PDF to 100 KB) and "Photo ko 20 KB kaise kare for an online form?" (image to 20 KB).
  - **New IBPS PO FAQ:** "Will my IBPS PO photo and signature pass the size check?". It quotes the 4-file test result.
- `npm run build` passes: postbuild OK, 36 pages, 1,721 internal links, 0 warnings.

### Needs human review
- **`updated` dates:** still 2026-10-30 on all 26 pages, because that field is outside the AEO agent's edit scope. Bump it to 2026-10-31 so "Last updated" and `dateModified` reflect this pass.
- **Template bug (components/ToolPage.tsx):** the HowTo heading on tool pages is built from the H1. It renders as "How to resize Image in Pixels, cm and KB Online — Free" (and the same pattern on the other 9 tool pages). A dedicated `howToTitle` field, or using `tool.name`, would read better and give cleaner HowTo schema.
- **Older copy with unsourced generalisations (not added in this pass; consider softening or sourcing):**
  - compress-pdf: "Many state scholarship portals cap documents at 200–300 KB", and "a 2-page phone scan can drop by 90% or more"
  - PDF to 100 KB: "the limit you will see most often", and "fits roughly one to three scanned pages"
  - PDF to 200 KB: "three to six scanned pages usually fit"
  - image to 20 KB intro: "one of the most common upload limits"
  - IBPS PO: "IBPS commonly uses these same sizes across its recruitments"
- **Unverified spec on the JEE Main page:** the "supporting documents 50–300 KB PDF" figure appears in page copy but not in the preset `config`. Confirm it against the 2027 bulletin.
- **Out of scope, still the lowest pages:** home, contact and terms. They need answer-first intros, but they are not generated from data/*.json.

### Citations to check manually
| Query | Should surface |
|---|---|
| "IBPS PO 2026 photo signature thumb declaration size" | /exam-photo-signature/ibps-po/ |
| "SSC CGL 2026 photo size" (should get the live-photo answer) | /exam-photo-signature/ssc-cgl/ |
| "compress pdf to 100kb" / "pdf 100kb kaise kare" | /compress-pdf/to-100kb/ |
| "passport size photo in pixels 300 dpi" | /resize-image/passport-size-photo/ |
| "UPSC triple signature size" | /exam-photo-signature/upsc-cse/ |

### Main-session follow-up (same day): review items resolved
- **Wrong engine size fixed.** The Ghostscript engine is about 11 MB to download (brotli 10.6 MB, gzip 11.2 MB), not "about 5 MB". This was corrected in the Compress PDF UI note and in 3 places in tools.json.
- **8 unsourced generalisations rewritten.** Each now uses measured "in our tests" data, a verified spec (JEE Main 2027 supporting PDFs 50–300 KB; SSC CGL and IBPS PO signatures 10–20 KB), or neutral wording.
- **`updated` set to 2026-10-31** on all 26 pages.
- **How-to headings fixed.** A new `howTo` field gives each tool a proper title, and the passport preset gets one too. The HowTo schema name now reads naturally.
- **JEE 50–300 KB:** confirmed by the 2026-10-30 bulletin research (Class 10 certificate etc. as PDF 50–300 KB).
- **Still open:**
  - home, contact and terms have low citability and need answer-first intros
  - the first-use Ghostscript download (about 11 MB) is heavy on 4G; worth exploring a smaller build
