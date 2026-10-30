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
        <label className="block max-w-2xl">
          <span className="sr-only">Search tools</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="What do you need? e.g. compress, signature, merge"
            className="min-h-12 w-full rounded-xl border border-line bg-card px-4 text-base shadow-sm outline-none focus:border-brand-500"
          />
        </label>
      )}
      {groups.map(
        (g) =>
          (g.items.length > 0 || !query) && (
            <section key={g.id} id={g.id} aria-labelledby={`${g.id}-h`} className="mt-8 scroll-mt-20">
              <h2 id={`${g.id}-h`} className="text-lg font-bold">
                {g.title}
              </h2>
              <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((t) => (
                  <li key={t.slug}>
                    <Link
                      href={`/${t.slug}/`}
                      className="flex h-full min-h-16 items-start gap-3 rounded-[var(--radius-card)] border border-line bg-card p-4 transition hover:-translate-y-0.5 hover:border-brand-500 hover:shadow-sm"
                    >
                      <span className="rounded-lg bg-brand-50 p-2 text-brand-700">
                        <ToolIcon slug={t.slug} />
                      </span>
                      <span>
                        <span className="block font-semibold">{t.name}</span>
                        <span className="mt-0.5 block text-sm leading-snug text-muted">{t.short}</span>
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
