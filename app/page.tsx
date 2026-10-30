import Link from "next/link";
import Faq from "@/components/Faq";
import ToolGrid from "@/components/ToolGrid";
import { examPresets, presetPath, presets, tools } from "@/lib/data";
import { pageMeta } from "@/lib/meta";
import { site } from "@/lib/site";

export const metadata = pageMeta({
  title: "Documently — Free PDF & Photo Tools for Indian Forms",
  description:
    "Compress PDF to 100 KB, resize exam photos and signatures, merge, split and convert — free, no signup, and your files never leave your device.",
  path: "/",
});

const sizePresets = presets.filter((p) => p.kind === "size");

const trust = [
  { title: "Files stay on your phone", body: "Every tool runs inside your browser. Nothing is uploaded to a server — not even temporarily." },
  { title: "Exact sizes, not guesses", body: "Pick the KB limit or pixel size the form asks for and get a file that fits, first time." },
  { title: "Specs from official notices", body: "Exam presets link to the authority's own notification with the date we last checked it." },
];

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

export default function Home() {
  return (
    <main>
      <section className="border-b border-line bg-gradient-to-b from-brand-50 to-paper">
        <div className="mx-auto max-w-5xl px-4 pb-8 pt-8 sm:pb-12 sm:pt-14">
          <h1 className="max-w-2xl text-[2rem] font-extrabold leading-[1.1] tracking-tight sm:text-5xl">{site.tagline}</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[#2b3532]">
            Compress, resize and convert PDFs and photos to the exact size an exam, job or government form asks for. {site.trustLine}.
          </p>
          <div className="mt-6">
            <ToolGrid tools={tools.map(({ slug, name, short, category }) => ({ slug, name, short, category }))} searchable />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4">
        {examPresets.length > 0 && (
          <section id="exam-presets" aria-labelledby="exam-h" className="mt-10 scroll-mt-20">
            <h2 id="exam-h" className="text-lg font-bold">
              Popular exam presets
            </h2>
            <p className="mt-1 text-sm text-muted">Photo, signature and other uploads sized exactly to the official notice.</p>
            <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {examPresets.map((p) => (
                <li key={p.slug}>
                  <Link href={presetPath(p)} className="flex h-full flex-col rounded-[var(--radius-card)] border border-line bg-card p-4 hover:border-brand-500">
                    <span className="font-semibold">{p.chip}</span>
                    <span className="mt-1 text-sm text-muted">{p.authority}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="sizes-h" className="mt-10">
          <h2 id="sizes-h" className="text-lg font-bold">
            One-tap sizes
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {sizePresets.map((p) => (
              <li key={p.slug}>
                <Link href={presetPath(p)} className="inline-flex min-h-11 items-center rounded-full border border-line bg-card px-4 text-sm font-semibold hover:border-brand-500 hover:text-brand-700">
                  {p.h1}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="Why Documently" className="mt-12 grid gap-4 sm:grid-cols-3">
          {trust.map((t) => (
            <div key={t.title} className="rounded-[var(--radius-card)] border border-line bg-card p-5">
              <h2 className="font-bold">{t.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{t.body}</p>
            </div>
          ))}
        </section>

        <div className="max-w-3xl">
          <Faq items={faqs} />
        </div>
      </div>
    </main>
  );
}
