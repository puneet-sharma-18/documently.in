import Link from "next/link";
import { Logo } from "./Brand";


const nav = [
  ["PDF", "/#pdf-tools"],
  ["Photo", "/#image-tools"],
  ["Exams", "/#exam-presets"],
  ["About", "/about/"],
] as const;

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex items-center gap-2 text-[1.05rem] font-bold tracking-tight" aria-label="documently.in home">
          <Logo />
          <span>
            documently<span className="text-muted">.in</span>
          </span>
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 text-[0.8rem] font-semibold sm:flex">
          {nav.map(([label, href]) => (
            <Link key={href} href={href} className="rounded-full px-3 py-2 hover:bg-paper">
              {label}
            </Link>
          ))}
        </nav>
        <Link
          href="/compress-pdf/"
          className="inline-flex min-h-10 items-center rounded-full bg-lime px-4 text-[0.8rem] font-semibold text-ink hover:bg-brand-500"
        >
          Compress PDF
        </Link>
      </div>
      <nav aria-label="Main (mobile)" className="flex justify-center gap-1 border-t border-line/70 px-2 text-[0.8rem] font-semibold sm:hidden">
        {nav.slice(0, 3).map(([label, href]) => (
          <Link key={href} href={href} className="flex min-h-10 items-center rounded-full px-4">
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
