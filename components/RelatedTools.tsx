import Link from "next/link";
import { getTool, presetPath, presets } from "@/lib/data";
import ToolIcon from "./ToolIcon";

/** `refs` are tool slugs ("merge-pdf") or preset refs ("compress-pdf/to-100kb"); unknown refs are skipped. */
export default function RelatedTools({ refs }: { refs: string[] }) {
  const relTools = refs.filter((r) => !r.includes("/")).map(getTool).filter((t) => t !== undefined);
  const relPresets = refs
    .filter((r) => r.includes("/"))
    .map((r) => {
      const [tool, slug] = r.split("/");
      return presets.find((p) => p.tool === tool && p.slug === slug);
    })
    .filter((p) => p !== undefined);
  if (!relTools.length && !relPresets.length) return null;
  return (
    <section aria-labelledby="related" className="mt-10">
      <h2 id="related" className="text-2xl font-semibold">
        Related tools
      </h2>
      <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {relTools.map((t) => (
          <li key={t.slug}>
            <Link
              href={`/${t.slug}/`}
              className="flex min-h-14 items-center gap-3 rounded-2xl border border-line bg-card px-4 py-3 transition hover:border-ink"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-lime text-ink">
                <ToolIcon slug={t.slug} />
              </span>
              <span>
                <span className="block font-semibold">{t.name}</span>
                <span className="block text-sm text-muted">{t.short}</span>
              </span>
            </Link>
          </li>
        ))}
        {relPresets.map((p) => (
          <li key={p.slug}>
            <Link
              href={presetPath(p)}
              className="flex min-h-14 items-center gap-3 rounded-2xl border border-line bg-card px-4 py-3 transition hover:border-ink"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-lime text-ink">
                <ToolIcon slug={p.tool} />
              </span>
              <span className="font-semibold">{p.h1}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
