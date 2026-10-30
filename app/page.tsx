import Link from "next/link";
import Faq from "@/components/Faq";
import ToolGrid from "@/components/ToolGrid";
import ToolIcon from "@/components/ToolIcon";
import { PillLink } from "@/components/Brand";
import { examPresets, presetPath, presets, tools, type ExamItem } from "@/lib/data";
import { pageMeta } from "@/lib/meta";
import { site } from "@/lib/site";

export const metadata = pageMeta({
  title: "Documently — Free PDF & Photo Tools for Indian Forms",
  description:
    "Compress PDF to 100 KB, resize exam photos and signatures, merge, split and convert — free, no signup, and your files never leave your device.",
  path: "/",
});

const sizePresets = presets.filter((p) => p.kind === "size");
const sizeGroups = [
  { label: "PDF sizes", blurb: "For certificates, marksheets and ID proofs on any upload portal.", tool: "compress-pdf", cta: "Open Compress PDF" },
  { label: "Photo sizes", blurb: "For photos and scans that must stay under a KB limit.", tool: "compress-image", cta: "Open Compress Image" },
  { label: "Passport & signature", blurb: "For exact pixel sizes, DPI and KB ranges in one go.", tool: "resize-image", cta: "Open Resize Image" },
].map((g) => ({ ...g, items: sizePresets.filter((p) => p.tool === g.tool) }));

const faqs = [
  {
    q: "Is Documently really free?",
    a: "Yes. Every tool is free with no signup, no watermark and no daily limit. The site may show ads in future to cover costs, but they will never sit next to the upload or download buttons.",
  },
  {
    q: "Are my documents uploaded anywhere?",
    a: "No. Your files are processed by code running in your own browser, so they never leave your device. We only record anonymous usage counts such as which tool was used and the file size, never the file itself or its name.",
  },
  {
    q: "How do I reduce a PDF to 100 KB for an online form?",
    a: "Open Compress PDF to 100 KB, choose your file and tap the button. The tool lowers image resolution step by step until the PDF is under 100 KB, and tells you if the file can't get that small without becoming unreadable.",
  },
  {
    q: "Which exam photo and signature sizes are supported?",
    a: `Right now: ${examPresets.map((p) => p.exam).join(", ")} — each checked against the official notice. You can also enter any custom pixel size and KB range in the Resize Image tool.`,
  },
  {
    q: "Does it work on mobile?",
    a: "Yes. Documently is built for phones first and works in Chrome, Safari and other modern mobile browsers, including on slower 4G connections.",
  },
];

const kb = (i: ExamItem) => (i.minKB && i.maxKB ? `${i.minKB}–${i.maxKB} KB` : i.maxKB ? `≤ ${i.maxKB} KB` : "");

export default function Home() {
  return (
    <main>
      <Hero />

      {/* Exam strip — the "logo bar" */}
      <nav aria-label="Exam presets" className="border-b border-line bg-white">
        <ul className="mx-auto flex max-w-6xl items-center gap-x-8 gap-y-2 overflow-x-auto px-4 py-4 text-sm font-semibold text-muted [scrollbar-width:none] sm:justify-between">
          {examPresets.map((p) => (
            <li key={p.slug} className="shrink-0">
              <Link href={presetPath(p)} className="flex min-h-10 items-center gap-2 hover:text-ink">
                <span className="h-2 w-2 rounded-full bg-brand-500" aria-hidden />
                {p.chip}
              </Link>
            </li>
          ))}
          <li className="shrink-0">
            <Link href="/resize-image/" className="flex min-h-10 items-center gap-2 hover:text-ink">
              <span className="h-2 w-2 rounded-full bg-ink" aria-hidden />
              Any custom size
            </Link>
          </li>
        </ul>
      </nav>

      <div className="mx-auto max-w-6xl px-4">
        {/* Why — bento */}
        <section aria-labelledby="why-h" className="pt-20 text-center sm:pt-24">
          <p className="eyebrow">Why Documently</p>
          <h2 id="why-h" className="mx-auto mt-4 max-w-3xl text-[1.9rem] font-semibold leading-[1.12] sm:text-5xl">
            Built for Indian forms, sized to the <Badge>KB</Badge> exact limit and <Badge dark>✓</Badge>{" "}
            <span className="text-muted">never uploaded anywhere</span>
          </h2>
        </section>
        <div className="mt-10 grid gap-3 md:grid-cols-3">
          <div className="sky relative flex min-h-64 flex-col justify-between overflow-hidden rounded-[var(--radius-card)] p-6 text-white">
            <p className="text-xs font-semibold">documently</p>
            <div>
              <p className="text-6xl font-semibold tracking-tight [text-shadow:0_1px_12px_rgb(0_40_100/0.35)]">{tools.length}</p>
              <p className="mt-2 max-w-[16rem] text-sm font-medium text-ink">Free PDF and photo tools, each one a single tap from the home page.</p>
            </div>
          </div>
          <div className="card flex min-h-64 flex-col justify-between p-6 text-left">
            <div>
              <p className="text-sm text-muted">Where your file goes</p>
              <p className="mt-2 text-5xl font-semibold tracking-tight">0 bytes</p>
              <p className="mt-1 text-sm text-muted">uploaded to our servers</p>
            </div>
            <p className="mt-6 text-sm leading-relaxed">
              Every tool runs inside your browser. Nothing is uploaded — not even temporarily.
            </p>
          </div>
          <div className="grid gap-3">
            <div className="flex flex-col justify-between rounded-[var(--radius-card)] bg-lime p-6 text-left">
              <p className="text-sm font-medium">Ready-made sizes</p>
              <p className="mt-4 text-5xl font-semibold tracking-tight">{sizePresets.length}</p>
              <p className="mt-2 text-sm">PDF to 50 KB through 1 MB, photos to 10 KB, passport and signature presets.</p>
            </div>
            <div className="flex items-center justify-between rounded-[var(--radius-card)] bg-ink p-6 text-white">
              <p className="text-sm">Exams checked against the official notice</p>
              <p className="text-4xl font-semibold tracking-tight">{examPresets.length}</p>
            </div>
          </div>
        </div>

        {/* Tools — services grid */}
        <section aria-labelledby="tools-h" className="pt-24 text-center">
          <p className="eyebrow">Tools</p>
          <h2 id="tools-h" className="mx-auto mt-4 max-w-2xl text-[1.9rem] font-semibold leading-[1.12] sm:text-5xl">
            Every PDF and photo fix a form asks for
          </h2>
          <p className="mx-auto mt-4 max-w-md text-muted">Compress, resize, convert, merge and split — free, with no signup and no watermark.</p>
        </section>
        <div className="mt-8">
          <ToolGrid tools={tools.map(({ slug, name, short, category }) => ({ slug, name, short, category }))} searchable />
        </div>

        {/* Exams — expertise grid */}
        {examPresets.length > 0 && (
          <>
            <section id="exam-presets" aria-labelledby="exam-h" className="scroll-mt-24 pt-24 text-center">
              <p className="eyebrow">Exam presets</p>
              <h2 id="exam-h" className="mx-auto mt-4 max-w-2xl text-[1.9rem] font-semibold leading-[1.12] sm:text-5xl">
                Where official notices meet one‑tap sizing
              </h2>
              <p className="mx-auto mt-4 max-w-md text-muted">
                Every upload sized to the authority&apos;s own notification, with the source and the date we last checked it.
              </p>
            </section>
            <ul className="mt-10 grid gap-3 rounded-[28px] border border-line bg-white p-3 sm:grid-cols-2">
              {examPresets.map((p, idx) => (
                <li key={p.slug} className={idx === examPresets.length - 1 && examPresets.length % 2 ? "sm:col-span-2" : ""}>
                  <Link href={presetPath(p)} className="group flex h-full flex-col rounded-[20px] border border-line bg-white p-5 transition hover:border-ink sm:p-6">
                    <div className="flex flex-wrap gap-2 rounded-2xl bg-paper p-4">
                      {(p.config.items ?? []).map((i) => (
                        <span key={i.key} className="card inline-flex flex-col rounded-xl px-3 py-2 text-left">
                          <span className="text-xs font-semibold text-muted">{i.label}</span>
                          <span className="mt-0.5 text-sm font-semibold">
                            {i.outWidth} × {i.outHeight} px
                          </span>
                          {kb(i) && <span className="text-xs text-muted">{kb(i)}</span>}
                        </span>
                      ))}
                    </div>
                    <span className="mt-5 flex items-center justify-between gap-3">
                      <span>
                        <span className="block text-lg font-semibold tracking-tight">{p.exam}</span>
                        <span className="mt-0.5 block text-sm text-muted">{p.authority}</span>
                      </span>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime transition group-hover:bg-ink group-hover:text-lime" aria-hidden>
                        →
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        {/* Sizes — pricing-style cards */}
        <section aria-labelledby="sizes-h" className="pt-24 text-center">
          <p className="eyebrow">One-tap sizes</p>
          <h2 id="sizes-h" className="mx-auto mt-4 max-w-2xl text-[1.9rem] font-semibold leading-[1.12] sm:text-5xl">
            Pick the limit. We&apos;ll hit it.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-muted">Each size has its own page with the settings already applied.</p>
        </section>
        <div className="mt-10 grid gap-3 rounded-[28px] border border-line bg-white p-3 md:grid-cols-3">
          {sizeGroups.map((g) => (
            <div key={g.label} className="flex flex-col rounded-[20px] border border-line p-5 sm:p-6">
              <p className="flex items-center gap-2 text-[0.8rem] font-semibold">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-lime">
                  <ToolIcon slug={g.tool} className="h-4 w-4" />
                </span>
                {g.label}
              </p>
              <p className="mt-4 text-sm text-muted">{g.blurb}</p>
              <p className="mt-4 text-4xl font-semibold tracking-tight">
                ₹0 <span className="text-sm font-normal text-muted">/ always</span>
              </p>
              <ul className="mt-5 flex-1 space-y-1 border-t border-line pt-4">
                {g.items.map((p) => (
                  <li key={p.slug}>
                    <Link href={presetPath(p)} className="flex min-h-10 items-center gap-2.5 text-sm hover:underline">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-[0.6rem] text-lime" aria-hidden>
                        ✓
                      </span>
                      {p.h1}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href={`/${g.tool}/`}
                className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white hover:bg-brand-700"
              >
                {g.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="mx-auto max-w-3xl pt-14">
          <Faq items={faqs} />
        </div>

        {/* Closing CTA */}
        <section aria-labelledby="cta-h" className="sky relative mt-20 overflow-hidden rounded-[28px] px-6 pb-36 pt-10 text-white sm:px-12 sm:pt-14">
          <p className="text-xs font-semibold">{site.trustLine}</p>
          <h2 id="cta-h" className="mt-4 max-w-xl text-[1.9rem] font-semibold leading-[1.1] sm:text-5xl">
            Your documents never leave your phone
          </h2>
          <p className="mt-4 max-w-md text-white/90">
            Open a tool, pick your file, download the result. The work happens in your browser — there is nothing to upload and nothing to sign up for.
          </p>
          <PillLink href="/compress-pdf/" tone="lime" className="mt-6">
            Start with Compress PDF
          </PillLink>
        </section>
      </div>
    </main>
  );
}

function Hero() {
  return (
    <section className="sky relative overflow-hidden">
      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-14 text-center text-white sm:pb-24 sm:pt-20">
        <h1 className="mx-auto max-w-3xl text-[2.3rem] font-semibold leading-[1.05] tracking-[-0.035em] sm:text-6xl">
          Free PDF &amp; photo tools for <span className="text-lime [text-shadow:none]">every Indian form</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-[1.05rem] leading-relaxed text-white/95">
          Compress, resize and convert PDFs and photos to the exact size an exam, job or government form asks for.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <PillLink href="#pdf-tools" tone="white">
            Browse tools
          </PillLink>
          <PillLink href="/compress-pdf/to-100kb/" tone="lime">
            PDF to 100 KB
          </PillLink>
        </div>

        {/* Floating widget cards — decorative, all numbers are real specs or our test results. */}
        <div aria-hidden className="relative mx-auto mt-12 flex h-44 max-w-4xl items-end justify-center text-left text-ink sm:mt-16 sm:h-56">
          <Widget className="absolute left-0 top-6 hidden w-40 -rotate-6 sm:block" label="PDF · in our tests" big="5.16 MB" sub="→ 284 KB for a 500 KB limit" />
          <Widget className="absolute left-0 top-2 w-[8.5rem] -rotate-3 sm:w-36 sm:left-[22%] sm:top-0" label="IBPS PO photo" big="200 × 230" sub="px · 20–50 KB" tick />
          <div className="relative z-10 flex h-32 w-24 flex-col justify-between rounded-2xl bg-sky-deep p-3 sm:w-48 sm:p-4 text-white shadow-[0_20px_50px_-20px_rgb(0_40_100/0.6)] ring-1 ring-white/50 sm:h-44">
            <span className="text-xs font-semibold">Uploads</span>
            <span>
              <span className="block text-4xl font-semibold tracking-tight">0</span>
              <span className="text-xs">runs in your browser</span>
            </span>
          </div>
          <Widget className="absolute right-0 top-2 w-[8.5rem] rotate-3 sm:w-36 sm:right-[22%] sm:top-0" label="Signature" big="10–20 KB" sub="SSC CGL · IBPS PO" tick />
          <Widget className="absolute right-0 top-6 hidden w-40 rotate-6 sm:block" label="UPSC CSE" big="Triple sign" sub="20–100 KB" />
        </div>
        <p className="relative mt-8 text-xs font-semibold sm:text-[0.8rem] text-ink/80">{site.trustLine}</p>
      </div>
    </section>
  );
}

function Widget({ className, label, big, sub, tick }: { className: string; label: string; big: string; sub: string; tick?: boolean }) {
  return (
    <div className={`rounded-2xl bg-white p-3.5 shadow-[0_20px_40px_-18px_rgb(0_40_100/0.45)] ${className}`}>
      <span className="flex items-center justify-between text-xs font-semibold text-muted">
        {label}
        {tick && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-lime text-[0.55rem] text-ink">✓</span>}
      </span>
      <span className="mt-2 block text-xl font-semibold tracking-tight">{big}</span>
      <span className="block text-[0.7rem] text-muted">{sub}</span>
    </div>
  );
}

function Badge({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <span
      aria-hidden
      className={`mx-1 inline-flex h-[0.9em] min-w-[0.9em] -translate-y-[0.05em] items-center justify-center rounded-full px-[0.22em] align-middle text-[0.42em] font-bold ${
        dark ? "bg-ink text-lime" : "bg-lime text-ink"
      }`}
    >
      {children}
    </span>
  );
}
