"use client";

import Link from "next/link";
import { useState } from "react";
import ToolIcon from "./ToolIcon";

type Card = { slug: string; name: string; short: string; category: "pdf" | "image" };

/** Tool grid with an instant filter. Cards are server-rendered; the filter only hides them. */
export default function ToolGrid({ tools, searchable }: { tools: Card[]; searchable?: boolean }) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const match = (t: Card) => !query || `${t.name} ${t.short} ${t.slug}`.toLowerCase().includes(query);
  const groups: { id: string; title: string; items: Card[] }[] = [
    { id: "pdf-tools", title: "PDF tools", items: tools.filter((t) => t.category === "pdf" && match(t)) },
    { id: "image-tools", title: "Photo & image tools", items: tools.filter((t) => t.category === "image" && match(t)) },
  ];

  return (
    <div>
      {searchable && (
        <label className="mx-auto block max-w-xl">
          <span className="sr-only">Search tools</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="What do you need? e.g. compress, signature, merge"
            className="min-h-13 w-full rounded-full border border-line bg-white px-6 text-base shadow-[0_8px_24px_-14px_rgb(15_17_18/0.25)] outline-none placeholder:text-muted focus:border-ink"
          />
        </label>
      )}
      {groups.map(
        (g) =>
          (g.items.length > 0 || !query) && (
            <section key={g.id} id={g.id} aria-labelledby={`${g.id}-h`} className="mt-10 scroll-mt-24 text-left">
              <h2 id={`${g.id}-h`} className="eyebrow">
                {g.title}
              </h2>
              <ul className="mt-4 grid grid-cols-1 gap-3 rounded-[28px] border border-line bg-white p-3 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((t) => (
                  <li key={t.slug}>
                    <Link
                      href={`/${t.slug}/`}
                      className="group flex h-full flex-col justify-between gap-4 rounded-[20px] sm:min-h-36 sm:gap-6 border border-line bg-white p-5 transition hover:border-ink"
                    >
                      <span className="flex items-start justify-between">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime text-ink">
                          <ToolIcon slug={t.slug} className="h-5 w-5" />
                        </span>
                        <span aria-hidden className="text-muted transition group-hover:translate-x-0.5 group-hover:text-ink">
                          →
                        </span>
                      </span>
                      <span>
                        <span className="block text-[1.05rem] font-semibold tracking-tight">{t.name}</span>
                        <span className="mt-1 block text-sm leading-snug text-muted">{t.short}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ),
      )}
      {query && groups.every((g) => !g.items.length) && <p className="mt-6 text-muted">No tool matches “{q}”. Try “pdf”, “photo” or “signature”.</p>}
    </div>
  );
}
