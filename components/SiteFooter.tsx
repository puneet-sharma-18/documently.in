import Link from "next/link";
import { tools, examPresets, presetPath } from "@/lib/data";
import { site } from "@/lib/site";
import { Logo } from "./Brand";

const linkCls = "text-white/65 hover:text-lime";

export default function SiteFooter() {
  return (
    <footer className="px-3 pb-3 pt-16 sm:px-4 sm:pb-4">
      <div className="mx-auto max-w-[70rem] rounded-[28px] bg-ink px-5 py-10 text-white sm:px-10 sm:py-12">
        <div className="grid gap-10 text-sm md:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-lg font-bold tracking-tight" aria-label="documently.in home">
              <Logo className="h-8 w-8 rounded-[9px] ring-1 ring-white/20" />
              documently<span className="-ml-2 text-white/50">.in</span>
            </Link>
            <p className="mt-4 max-w-xs leading-relaxed text-white/65">
              Free PDF and photo tools sized for Indian exam, job and government forms. {site.trustLine}.
            </p>
            <a
              href={`mailto:${site.email}`}
              className="mt-6 inline-flex min-h-11 items-center rounded-full bg-lime px-5 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-ink hover:bg-brand-500"
            >
              {site.email}
            </a>
          </div>
          <FooterCol title="PDF & photo tools">
            {tools.map((t) => (
              <li key={t.slug}>
                <Link href={`/${t.slug}/`} className={linkCls}>
                  {t.name}
                </Link>
              </li>
            ))}
          </FooterCol>
          <FooterCol title="Exam presets">
            {examPresets.map((p) => (
              <li key={p.slug}>
                <Link href={presetPath(p)} className={linkCls}>
                  {p.chip}
                </Link>
              </li>
            ))}
          </FooterCol>
          <FooterCol title={site.name}>
            {[
              ["About", "/about/"],
              ["Contact", "/contact/"],
              ["Privacy Policy", "/privacy/"],
              ["Terms of Use", "/terms/"],
              ["Disclaimer", "/disclaimer/"],
            ].map(([label, href]) => (
              <li key={href}>
                <Link href={href} className={linkCls}>
                  {label}
                </Link>
              </li>
            ))}
            <li>
              <a href={site.sourceUrl} className={linkCls} rel="noopener">
                Source code (AGPL-3.0)
              </a>
            </li>
          </FooterCol>
        </div>
        <p className="mt-10 border-t border-white/10 pt-6 text-xs leading-relaxed text-white/50">
          © {new Date().getFullYear()} {site.name}. Not affiliated with any exam authority or government body — always check the official
          notification before you submit.
        </p>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-white">{title}</p>
      <ul className="mt-4 space-y-2.5">{children}</ul>
    </div>
  );
}
