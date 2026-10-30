import Link from "next/link";
import { getTool, presetPath, presets } from "@/lib/data";
import ToolIcon from "./ToolIcon";

export default function RelatedTools({ toolSlugs, presetSlugs = [] }: { toolSlugs: string[]; presetSlugs?: string[] }) {
  const relTools = toolSlugs.map(getTool).filter((t) => t !== undefined);
  const relPresets = presetSlugs
    .map((s) => presets.find((p) => p.slug === s))
    .filter((p) => p !== undefined);
  if (!relTools.length && !relPresets.length) return null;
  return (
    <section aria-labelledby="related" className="mt-10">
      <h2 id="related" className="text-xl font-bold">
        Related tools
      </h2>
      <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {relTools.map((t) => (
          <li key={t.slug}>
            <Link
              href={`/${t.slug}/`}
              className="flex min-h-14 items-center gap-3 rounded-[var(--radius-card)] border border-line bg-card px-4 py-3 hover:border-brand-500"
            >
              <span className="text-brand-600">
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
              className="flex min-h-14 items-center gap-3 rounded-[var(--radius-card)] border border-line bg-card px-4 py-3 hover:border-brand-500"
            >
              <span className="text-brand-600">
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
