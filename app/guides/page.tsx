import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import ToolIcon from "@/components/ToolIcon";
import { getGuides } from "@/lib/guides";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta({
  title: "Guides: Exam Photo, PDF & Form Upload Help | Documently",
  description: "Short, practical guides for Indian exam and government form uploads: photo and signature sizes, PDF limits, and how to fix rejected files.",
  path: "/guides/",
});

export default function GuidesIndex() {
  const guides = getGuides();
  return (
    <main className="mx-auto max-w-3xl px-4 pb-12 pt-4">
      <Breadcrumbs items={[{ name: "Guides", href: "/guides/" }]} />
      <p className="eyebrow mt-6">Guides</p>
      <h1 className="mt-3 text-[1.85rem] font-semibold leading-[1.15] tracking-[-0.03em] sm:text-[2.4rem]">Form upload guides</h1>
      <p className="mt-3 text-[1.05rem] text-brand-700">Exact sizes, official sources and quick fixes for the files Indian exam and government forms ask for.</p>
      {guides.length === 0 ? (
        <p className="mt-8 text-muted">The first guides are on their way.</p>
      ) : (
        <ul className="mt-8 space-y-3">
          {guides.map((g) => (
            <li key={g.slug}>
              <Link href={`/guides/${g.slug}/`} className="card flex gap-4 p-5 transition hover:ring-1 hover:ring-ink">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime text-ink">
                  <ToolIcon slug={g.tool} />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold leading-snug">{g.h1}</span>
                  <span className="mt-1 block text-sm text-muted">{g.description}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
