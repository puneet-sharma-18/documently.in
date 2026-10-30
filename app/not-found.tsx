import type { Metadata } from "next";
import Link from "next/link";
import { tools } from "@/lib/data";

export const metadata: Metadata = {
  title: { absolute: "Page not found | Documently" },
  description: "That page doesn't exist. Pick a free PDF or photo tool below. Everything runs in your browser.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  const groups = [
    { id: "pdf", label: "PDF tools", items: tools.filter((t) => t.category === "pdf") },
    { id: "image", label: "Photo tools", items: tools.filter((t) => t.category === "image") },
  ];
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <p className="text-sm font-semibold text-brand-700">404</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">This page doesn’t exist</h1>
      <p className="mt-2 max-w-2xl text-muted">
        The link may be old or mistyped. The tool you need is probably one of these. All free, and your files stay on
        your device.
      </p>
      {groups.map((g) =>
        g.items.length ? (
          <section key={g.id} className="mt-8">
            <h2 className="text-lg font-semibold">{g.label}</h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map((t) => (
                <li key={t.slug}>
                  <Link
                    href={`/${t.slug}/`}
                    className="block h-full rounded-[var(--radius-card)] border border-line bg-card p-4 hover:border-brand-500 hover:bg-brand-50"
                  >
                    <span className="font-semibold">{t.name}</span>
                    <span className="mt-1 block text-sm text-muted">{t.short}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null,
      )}
      <p className="mt-10">
        <Link href="/" className="font-semibold text-brand-700 hover:underline">
          ← Back to the homepage
        </Link>
      </p>
    </main>
  );
}
