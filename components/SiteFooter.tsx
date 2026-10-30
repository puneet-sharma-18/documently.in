import Link from "next/link";
import { tools, examPresets, presetPath } from "@/lib/data";
import { site } from "@/lib/site";

export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-card">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 text-sm sm:grid-cols-3">
        <div>
          <p className="font-semibold">PDF & photo tools</p>
          <ul className="mt-3 space-y-2">
            {tools.map((t) => (
              <li key={t.slug}>
                <Link href={`/${t.slug}/`} className="text-muted hover:text-brand-700">
                  {t.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-semibold">Exam presets</p>
          <ul className="mt-3 space-y-2">
            {examPresets.map((p) => (
              <li key={p.slug}>
                <Link href={presetPath(p)} className="text-muted hover:text-brand-700">
                  {p.chip}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-semibold">{site.name}</p>
          <ul className="mt-3 space-y-2">
            {[
              ["About", "/about/"],
              ["Contact", "/contact/"],
              ["Privacy Policy", "/privacy/"],
              ["Terms of Use", "/terms/"],
              ["Disclaimer", "/disclaimer/"],
            ].map(([label, href]) => (
              <li key={href}>
                <Link href={href} className="text-muted hover:text-brand-700">
                  {label}
                </Link>
              </li>
            ))}
            <li>
              <a href={site.sourceUrl} className="text-muted hover:text-brand-700" rel="noopener">
                Source code (AGPL-3.0)
              </a>
            </li>
          </ul>
        </div>
      </div>
      <p className="mx-auto max-w-5xl px-4 pb-8 text-xs text-muted">
        © {new Date().getFullYear()} {site.name}. Not affiliated with any exam authority or government body — always check
        the official notification before you submit.
      </p>
    </footer>
  );
}
