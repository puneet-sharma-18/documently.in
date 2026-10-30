import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import RelatedTools from "@/components/RelatedTools";
import ToolIcon from "@/components/ToolIcon";
import { PillLink } from "@/components/Brand";
import { getTool } from "@/lib/data";
import { getGuide, getGuides } from "@/lib/guides";
import { pageMeta } from "@/lib/meta";
import { absoluteUrl, site } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return getGuides().map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const g = getGuide((await params).slug);
  if (!g) return {};
  return pageMeta({ title: g.title, description: g.description, path: `/guides/${g.slug}/` });
}

const longDate = (iso: string) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const g = getGuide((await params).slug);
  if (!g) notFound();
  const tool = getTool(g.tool);
  const path = `/guides/${g.slug}/`;

  return (
    <main className="mx-auto max-w-3xl px-4 pb-12 pt-4">
      <Breadcrumbs items={[{ name: "Guides", href: "/guides/" }, { name: g.h1, href: path }]} />
      <p className="eyebrow mt-6">Guide</p>
      <h1 className="mt-3 text-[1.85rem] font-semibold leading-[1.15] tracking-[-0.03em] sm:text-[2.4rem]">{g.h1}</h1>
      <p className="mt-3 text-sm text-muted">
        Updated {longDate(g.updated)} · {Math.max(1, Math.round(g.words / 200))} min read
      </p>

      {tool && (
        <aside className="card mt-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lime text-ink">
              <ToolIcon slug={tool.slug} />
            </span>
            <div>
              <p className="font-semibold">{tool.name}</p>
              <p className="text-sm text-muted">{tool.short}</p>
            </div>
          </div>
          <PillLink href={`/${tool.slug}/`} tone="ink" className="shrink-0 self-start sm:self-auto">
            Open tool
          </PillLink>
        </aside>
      )}

      <article className="prose-doc mt-6" dangerouslySetInnerHTML={{ __html: g.html }} />

      {g.sources.length > 0 && (
        <section aria-labelledby="sources" className="mt-10">
          <h2 id="sources" className="eyebrow">
            Sources
          </h2>
          <ul className="mt-3 space-y-1.5 text-sm">
            {g.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {g.faqs.length > 0 && <Faq items={g.faqs} />}

      <RelatedTools refs={[g.tool, ...g.related.filter((r) => r !== g.tool)]} />

      <p className="mt-10 text-sm text-muted">
        <Link href="/guides/" className="underline">
          All guides
        </Link>{" "}
        · Spotted something out of date? <a className="underline" href={`mailto:${site.email}`}>{site.email}</a>
      </p>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: g.h1,
          description: g.description,
          datePublished: g.date,
          dateModified: g.updated,
          mainEntityOfPage: absoluteUrl(path),
          inLanguage: "en-IN",
          author: { "@type": "Organization", name: site.name, url: site.url },
          publisher: { "@id": `${site.url}/#organization` },
          image: absoluteUrl("/opengraph-image.png"),
          ...(g.sources.length ? { citation: g.sources.map((s) => s.url) } : {}),
        }}
      />
    </main>
  );
}
