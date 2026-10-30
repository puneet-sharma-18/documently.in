import Link from "next/link";
import type { ReactNode } from "react";

/** Ink tile, white page, lime fold and an ink tick. Mirrored in scripts/generate-icons.mjs. */
export function Logo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="9" fill="#0f1112" />
      <path d="M10 7h8l5 5v13H10z" fill="#fff" />
      <path d="M18 7v5h5" fill="#d4f54a" />
      <path d="M13.5 17.5l2.5 2.5 4-4.5" fill="none" stroke="#0f1112" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Arrow({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path d="M4 12L12 4M6 4h6v6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type PillProps = { href: string; children: ReactNode; tone?: "ink" | "lime" | "white"; className?: string };

const tones = {
  ink: { pill: "bg-ink text-white hover:bg-brand-700", dot: "bg-lime text-ink" },
  lime: { pill: "bg-lime text-ink hover:bg-brand-500", dot: "bg-ink text-lime" },
  white: { pill: "bg-white text-ink hover:bg-paper", dot: "bg-ink text-white" },
};

/** The signature CTA: an uppercase pill with a round arrow badge on the right. */
export function PillLink({ href, children, tone = "ink", className = "" }: PillProps) {
  const t = tones[tone];
  return (
    <Link
      href={href}
      className={`group inline-flex min-h-12 items-center gap-3 rounded-full py-1.5 pl-5 pr-1.5 text-sm font-semibold transition ${t.pill} ${className}`}
    >
      {children}
      <span className={`flex h-9 w-9 items-center justify-center rounded-full transition group-hover:rotate-45 ${t.dot}`}>
        <Arrow />
      </span>
    </Link>
  );
}
