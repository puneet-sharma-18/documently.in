import JsonLd from "./JsonLd";
import type { Faq as FaqItem } from "@/lib/data";

export default function Faq({ items, heading = "Frequently asked questions" }: { items: FaqItem[]; heading?: string }) {
  if (!items.length) return null;
  return (
    <section aria-labelledby="faq" className="mt-12">
      <h2 id="faq" className="text-2xl font-semibold">
        {heading}
      </h2>
      <div className="card mt-5 divide-y divide-line">
        {items.map((f) => (
          <details key={f.q} className="group px-5 py-3 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-4 font-semibold">
              {f.q}
              <span aria-hidden className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lime text-ink transition group-open:rotate-45 group-open:bg-ink group-open:text-lime">
                +
              </span>
            </summary>
            <p className="pb-2 leading-relaxed text-brand-700">{f.a}</p>
          </details>
        ))}
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: items.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />
    </section>
  );
}
