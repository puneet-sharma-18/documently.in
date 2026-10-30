import JsonLd from "./JsonLd";
import type { Faq as FaqItem } from "@/lib/data";

export default function Faq({ items, heading = "Frequently asked questions" }: { items: FaqItem[]; heading?: string }) {
  if (!items.length) return null;
  return (
    <section aria-labelledby="faq" className="mt-10">
      <h2 id="faq" className="text-xl font-bold">
        {heading}
      </h2>
      <div className="mt-4 divide-y divide-line rounded-[var(--radius-card)] border border-line bg-card">
        {items.map((f) => (
          <details key={f.q} className="group px-4 py-3 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-4 font-semibold">
              {f.q}
              <span aria-hidden className="text-brand-600 transition group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="pb-2 leading-relaxed text-[#2b3532]">{f.a}</p>
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
