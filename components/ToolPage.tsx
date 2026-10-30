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

  return (
    <main className="mx-auto max-w-3xl px-4 pb-8 pt-4">
      <ViewTracker tool={tool.slug} preset={preset?.slug} />
      <Breadcrumbs items={crumbs} />

      <h1 className="mt-4 text-[1.7rem] font-extrabold leading-tight tracking-tight sm:text-4xl">{page.h1}</h1>
      <p className="mt-3 text-[1.05rem] leading-relaxed text-[#2b3532]">{page.answer}</p>
      <p className="mt-2 text-sm font-medium text-brand-700">{site.trustLine}</p>

      <div className="mt-5">
        <ToolRunner tool={tool.slug} presetSlug={preset?.slug} config={preset?.config} />
      </div>

      {preset?.kind === "exam" && preset.config.items && <SpecBox preset={preset} items={preset.config.items} />}

      {siblings.length > 0 && (
        <nav aria-label={`${tool.name} presets`} className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{preset ? "Other sizes & presets" : "Popular sizes & exam presets"}</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {siblings.map((p) => (
              <li key={p.slug}>
                <Link href={presetPath(p)} className="inline-flex min-h-11 items-center rounded-full border border-line bg-card px-4 text-sm font-semibold hover:border-brand-500 hover:text-brand-700">
                  {p.chip}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <section aria-labelledby="how-to" className="mt-10">
        <h2 id="how-to" className="text-xl font-bold">
          How to {lowerFirst(page.h1)}
        </h2>
        <ol className="mt-4 space-y-3">
          {page.steps.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-900">{i + 1}</span>
              <span className="pt-1 leading-relaxed">{s}</span>
            </li>
          ))}
        </ol>
      </section>

      <AdSlot slot="after-howto" />

      <article className="prose-doc mt-6">
        <p>{page.intro}</p>
        {page.sections.map((s) => (
          <ContentSection key={s.heading} section={s} />
        ))}
      </article>

      <Faq items={page.faqs} />

      <RelatedTools toolSlugs={related.filter((r) => !r.includes("/"))} presetSlugs={related.filter((r) => r.includes("/")).map((r) => r.split("/")[1])} />

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
            name: `How to ${lowerFirst(page.h1)}`,
            description: page.answer,
            totalTime: "PT1M",
            estimatedCost: { "@type": "MonetaryAmount", currency: "INR", value: "0" },
            tool: { "@type": "HowToTool", name: `${site.name} ${tool.name}` },
            step: page.steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.split(/[.—:]/)[0].slice(0, 80), text: s, url: `${absoluteUrl(path)}#how-to` })),
          },
        ]}
      />
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
  const parts = [];
  if (i.widthPx && i.heightPx) parts.push(`${i.widthPx} × ${i.heightPx} px`);
  if (i.widthCm && i.heightCm) parts.push(`${i.widthCm} × ${i.heightCm} cm`);
  return parts.length ? parts.join(" / ") : "Not specified";
}

/** Official spec table with citation — the part of the page AI answers and featured snippets quote. */
function SpecBox({ preset, items }: { preset: Preset; items: ExamItem[] }) {
  return (
    <section aria-labelledby="spec" className="mt-8 rounded-[var(--radius-card)] border border-line bg-card p-4 sm:p-5">
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
        <p className="mt-4 rounded-lg bg-paper p-3 text-sm">
          <strong>Source:</strong>{" "}
          <a href={preset.sourceUrl} className="text-brand-700 underline" rel="noopener noreferrer nofollow" target="_blank">
            {preset.sourceLabel ?? `${preset.authority} official notice`}
          </a>
          {preset.verifiedOn && <> · Verified on {longDate(preset.verifiedOn)}</>}. Always re-check the latest notice before you submit.
        </p>
      )}
    </section>
  );
}
