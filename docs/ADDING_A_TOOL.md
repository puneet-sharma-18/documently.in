# Adding a tool

Every tool runs in the browser. Files never leave the device. A new tool is five small edits; the page, menu, sitemap, schema and homepage grid all follow from the registry.

## 1. Engine (pick one)

| Work | Where | Runs in |
|---|---|---|
| pdf-lib (merge, split, rotate, numbers, watermark, organize) | add an op to `PdfJob` in `lib/tools/pdf-core.ts` | `pdf.worker.ts` via `run-pdf.ts` |
| Ghostscript (compress, unlock, protect) | add a `mode` in `public/workers/gs-worker.js` + `lib/tools/run-gs.ts` | classic worker, WASM lazy-loaded |
| Canvas image work | `lib/tools/image-core.ts` or a new `lib/tools/*.ts` | `image.worker.ts` via `run-image.ts` |
| PDF rendering | `lib/tools/pdf-render.ts` (pdfjs) | main thread, lazy |

A heavy dependency (WASM, decoders) must be `import()`ed only when the user actually needs it.

## 2. UI

`components/tools/<Name>.tsx`. Copy the closest existing tool. Use `Panel`, `Dropzone`, `Chips`, `FileRow`, `PrimaryButton`, `Busy` and `ErrorBox` from `components/tools/ui.tsx`, plus `useJob` and `ResultCard`. Throw `UserFacingError` (`lib/files.ts`) for messages the user should see verbatim.

## 3. Register

- `components/tools/ToolRunner.tsx`: one `dynamic(() => import("./Name"))` line, so each tool is its own chunk.
- `components/ToolIcon.tsx`: one 24×24 stroke path.
- `data/tools.json`: the entry (type `Tool` in `lib/data.ts`).
  - Keep it lean: a tool page is a tool first.
  - Title ≤ 60 chars, description ≤ 155 chars.
  - `keyFacts` is 134–167 words.
  - 3–5 steps, 4 FAQs.
  - No made-up numbers.
  - Add the new slug to `related` on 2–3 neighbouring tools.

The header mega menu, mobile drawer, homepage grid, sitemap and llms.txt pick it up automatically.

## 4. Verify

- `npx tsc --noEmit -p .` and `npx eslint`.
- `npm run build`. Postbuild fails on broken links and missing meta.
- Run the tool in a real browser with a real file and open the output.
  - For Ghostscript modes, `node scripts/test-gs-worker.mjs <file> <arg>` runs the real worker in Node.
- Mobile Lighthouse on the new page: performance ≥ 90, accessibility and SEO 100.

## 5. Ship

Push to `mvp-build`; Cloudflare Pages deploys. Then run `INDEXNOW_KEY=… node scripts/indexnow.mjs` to ping Bing and the other IndexNow engines.
