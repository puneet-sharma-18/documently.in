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
