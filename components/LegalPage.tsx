import type { Metadata } from "next";
import Breadcrumbs from "./Breadcrumbs";
import { absoluteUrl, site } from "@/lib/site";

export const LEGAL_UPDATED = "30 October 2026";

/**
 * Default share image (app/opengraph-image.png). A page that sets its own `openGraph` object loses the
 * file-convention image, so pass this explicitly.
 */
export const DEFAULT_OG_IMAGE = {
  url: "/opengraph-image.png",
  width: 1200,
  height: 630,
  alt: "Documently: free PDF and photo tools for every Indian form",
};

/** Shared metadata for the plain-text trust pages (about, privacy, terms, contact, disclaimer). */
export function legalMetadata(opts: { path: string; title: string; description: string }): Metadata {
  const url = absoluteUrl(opts.path);
  return {
    title: { absolute: opts.title },
    description: opts.description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: site.name,
      title: opts.title,
      description: opts.description,
      url,
      locale: "en_IN",
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: { card: "summary_large_image", title: opts.title, description: opts.description, images: [DEFAULT_OG_IMAGE.url] },
  };
}

export default function LegalPage({
  name,
  path,
  heading,
  updated = true,
  children,
}: {
  name: string;
  path: string;
  heading: string;
  updated?: boolean;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <Breadcrumbs items={[{ name, href: path }]} />
      <h1 className="mt-4 text-3xl font-bold tracking-tight">{heading}</h1>
      {updated && <p className="mt-2 text-sm text-muted">Last updated: {LEGAL_UPDATED}</p>}
      <div className="prose-doc mt-6">{children}</div>
    </main>
  );
}
