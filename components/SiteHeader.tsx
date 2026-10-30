import Link from "next/link";
import { site } from "@/lib/site";

export default function SiteHeader() {
  return (
    <header className="border-b border-line bg-card">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight" aria-label={`${site.name} home`}>
          <Logo />
          <span>
            documently<span className="text-brand-600">.in</span>
          </span>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 text-sm">
          <Link href="/#pdf-tools" className="rounded-md px-3 py-2 hover:bg-brand-50">
            PDF
          </Link>
          <Link href="/#image-tools" className="rounded-md px-3 py-2 hover:bg-brand-50">
            Photo
          </Link>
          <Link href="/#exam-presets" className="rounded-md px-3 py-2 hover:bg-brand-50">
            Exams
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function Logo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="8" fill="#0e7c66" />
      <path d="M10 7h8l5 5v13H10z" fill="#fff" />
      <path d="M18 7v5h5" fill="#a6dfd1" />
      <path d="M13.5 17.5l2.5 2.5 4-4.5" fill="none" stroke="#0e7c66" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
