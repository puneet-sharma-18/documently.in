import Link from "next/link";
import AdSlot from "./AdSlot";
import Breadcrumbs, { type Crumb } from "./Breadcrumbs";
import Faq from "./Faq";
import JsonLd from "./JsonLd";
import RelatedTools from "./RelatedTools";
import ViewTracker from "./ViewTracker";
import ToolRunner from "./tools/ToolRunner";
import { presetPath, presetsFor, type ExamItem, type Preset, type Section, type Tool } from "@/lib/data";
import { absoluteUrl, site } from "@/lib/site";
import { guidesForTool } from "@/lib/guides";

/** "Compress PDF" → "compress PDF", but leaves acronyms like "SSC CGL" alone. */
const lowerFirst = (s: string) => (/^[A-Z][a-z]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s);

const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** The §5 page template shared by every tool and preset page. */
export default function ToolPage({ tool, preset }: { tool: Tool; preset?: Preset }) {
  const page = preset ?? tool;
  const path = preset ? presetPath(preset) : `/${tool.slug}/`;
  const crumbs: Crumb[] = [{ name: tool.name, href: `/${tool.slug}/` }];
  if (preset) crumbs.push({ name: preset.chip, href: path });
  const siblings = presetsFor(tool.slug).filter((p) => p.slug !== preset?.slug);
  const related = preset?.related ?? tool.related;
  const howTo = preset?.kind === "exam" ? `How to resize your ${preset.exam} photo and signature` : preset ? (preset.howTo ?? `How to ${lowerFirst(preset.h1)}`) : (tool.howTo ?? `How to use ${tool.name}`);

  return (
    <main>
      <ViewTracker tool={tool.slug} preset={preset?.slug} />
      <div className="border-b border-line bg-gradient-to-b from-sky-pale/70 to-paper">
        <div className="mx-auto max-w-3xl px-4 pb-8 pt-4">
          <Breadcrumbs items={crumbs} />
          <p className="eyebrow mt-6">{preset?.kind === "exam" ? `${preset.authority ?? "Exam"} · verified preset` : tool.category === "pdf" ? "PDF tool" : "Photo tool"}</p>
          <h1 className="mt-3 text-[1.85rem] font-semibold leading-[1.1] tracking-[-0.03em] sm:text-[2.6rem]">{page.h1}</h1>
          <p className="mt-4 text-[1.05rem] leading-relaxed text-brand-700">{page.answer}</p>
          <ul className="mt-4 flex flex-wrap gap-2" aria-label="Why it's safe">
            {site.trustLine.split(" · ").map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold ring-1 ring-line">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500 ring-2 ring-brand-100" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <ToolRunner tool={tool.slug} presetSlug={preset?.slug} config={preset?.config} />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 pb-8">
      {preset?.kind === "exam" && preset.config.items && <SpecBox preset={preset} items={preset.config.items} />}

      {siblings.length > 0 && (
        <nav aria-label={`${tool.name} presets`} className="mt-8">
          <h2 className="eyebrow">{preset ? "Other sizes & presets" : "Popular sizes & exam presets"}</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {siblings.map((p) => (
              <li key={p.slug}>
                <Link href={presetPath(p)} className="inline-flex min-h-11 items-center rounded-full border border-line bg-card px-4 text-sm font-semibold transition hover:border-ink hover:bg-lime">
                  {p.chip}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <RelatedTools refs={related} />

      <section aria-labelledby="how-to" className="mt-10">
        <h2 id="how-to" className="text-xl font-semibold">
          {howTo}
        </h2>
        <ol className="mt-4 grid gap-2 sm:grid-cols-2">
          {page.steps.map((s, i) => (
            <li key={i} className="flex gap-3 rounded-2xl bg-card p-3 text-[0.95rem] ring-1 ring-line">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-lime">{i + 1}</span>
              <span className="pt-0.5 leading-snug">{s}</span>
            </li>
          ))}
        </ol>
      </section>

      <AdSlot slot="after-howto" />

      {/* Reference material stays in the page (search engines and answer engines read it) but folded away, so the page reads as a tool. */}
      <details className="card group mt-8 [&_summary::-webkit-details-marker]:hidden">
        <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-4 px-5 font-semibold">
          About {tool.name}: key facts and tips
          <span aria-hidden className="text-xl leading-none transition group-open:rotate-45">+</span>
        </summary>
        <div className="border-t border-line px-5 pb-5">
          {page.keyFacts && (
            <section aria-labelledby="key-facts">
              <h2 id="key-facts" className="mt-4 inline-flex rounded-full bg-lime px-3 py-1 text-[0.8rem] font-semibold">
                Key facts
              </h2>
              <p className="mt-3 leading-relaxed text-brand-700">{page.keyFacts}</p>
            </section>
          )}
          <article className="prose-doc mt-2">
            <p>{page.intro}</p>
            {page.sections.map((s) => (
              <ContentSection key={s.heading} section={s} />
            ))}
          </article>
        </div>
      </details>

      <Faq items={page.faqs} />

      {guidesForTool(tool.slug).length > 0 && (
        <nav aria-labelledby="guides" className="mt-10">
          <h2 id="guides" className="eyebrow">
            Guides
          </h2>
          <ul className="mt-3 space-y-2">
            {guidesForTool(tool.slug)
              .slice(0, 5)
              .map((g) => (
                <li key={g.slug}>
                  <Link href={`/guides/${g.slug}/`} className="underline underline-offset-2 hover:text-brand-700">
                    {g.h1}
                  </Link>
                </li>
              ))}
          </ul>
        </nav>
      )}

      <p className="mt-10 text-sm text-muted">
        Last updated {longDate(page.updated)}.{" "}
        {preset?.verifiedOn && <>Requirements checked against the official notice on {longDate(preset.verifiedOn)}. </>}
        Questions or a spec that changed? <a className="underline" href={`mailto:${site.email}`}>{site.email}</a>
      </p>

      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: page.h1,
            url: absoluteUrl(path),
            description: page.metaDescription,
            applicationCategory: "UtilitiesApplication",
            operatingSystem: "Any (runs in the browser)",
            browserRequirements: "Requires JavaScript and a modern browser",
            isAccessibleForFree: true,
            offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
            dateModified: page.updated,
            publisher: { "@type": "Organization", name: site.name, url: site.url },
          },
          {
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: howTo,
            description: page.answer,
            totalTime: "PT1M",
            estimatedCost: { "@type": "MonetaryAmount", currency: "INR", value: "0" },
            tool: { "@type": "HowToTool", name: `${site.name} ${tool.name}` },
            step: page.steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.split(/[.—:]/)[0].slice(0, 80), text: s, url: `${absoluteUrl(path)}#how-to` })),
          },
        ]}
      />
      </div>
    </main>
  );
}

function ContentSection({ section }: { section: Section }) {
  return (
    <>
      <h2>{section.heading}</h2>
      {section.paragraphs?.map((p, i) => <p key={i}>{p}</p>)}
      {section.bullets && (
        <ul>
          {section.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      )}
    </>
  );
}

function sizeText(i: ExamItem) {
  if (i.minKB && i.maxKB) return `${i.minKB}–${i.maxKB} KB`;
  if (i.maxKB) return `Up to ${i.maxKB} KB`;
  return "Not specified";
}

function dimText(i: ExamItem) {
  if (i.dimensions) return i.dimensions;
  const parts = [];
  if (i.widthPx && i.heightPx) parts.push(`${i.widthPx} × ${i.heightPx} px`);
  if (i.widthCm && i.heightCm) parts.push(`${i.widthCm} × ${i.heightCm} cm`);
  return parts.length ? parts.join(" / ") : "Not specified";
}

/** Official spec table with citation — the part of the page AI answers and featured snippets quote. */
function SpecBox({ preset, items }: { preset: Preset; items: ExamItem[] }) {
  return (
    <section aria-labelledby="spec" className="card mt-8 p-4 sm:p-6">
      <h2 id="spec" className="text-xl font-bold">
        Official {preset.exam} upload requirements
      </h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <caption className="sr-only">{preset.exam} photo and signature size, dimensions and format</caption>
          <thead>
            <tr className="border-b border-line text-muted">
              <th scope="col" className="py-2 pr-3 font-semibold">Upload</th>
              <th scope="col" className="py-2 pr-3 font-semibold">File size</th>
              <th scope="col" className="py-2 pr-3 font-semibold">Dimensions</th>
              <th scope="col" className="py-2 font-semibold">Format</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.key} className="border-b border-line align-top last:border-0">
                <th scope="row" className="py-2 pr-3 font-semibold">{i.label}</th>
                <td className="py-2 pr-3">{sizeText(i)}</td>
                <td className="py-2 pr-3">{dimText(i)}</td>
                <td className="py-2 uppercase">{i.format}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {items.some((i) => i.rules.length) && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {items
            .filter((i) => i.rules.length)
            .map((i) => (
              <div key={i.key}>
                <h3 className="font-semibold">{i.label} rules</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed">
                  {i.rules.map((r, k) => (
                    <li key={k}>{r}</li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      )}
      {preset.sourceUrl && (
        <p className="mt-5 rounded-2xl bg-brand-50 p-4 text-sm">
          <strong>Source:</strong>{" "}
          <a href={preset.sourceUrl} className="font-semibold underline decoration-2 underline-offset-2" rel="noopener noreferrer nofollow" target="_blank">
            {preset.sourceLabel ?? `${preset.authority} official notice`}
          </a>
          {preset.verifiedOn && <> · Verified on {longDate(preset.verifiedOn)}</>}. Always re-check the latest notice before you submit.
        </p>
      )}
    </section>
  );
}
