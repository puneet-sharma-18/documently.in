import type { Metadata } from "next";
import { absoluteUrl, site } from "./site";

const ogImage = { url: "/opengraph-image.png", width: 1200, height: 630, alt: `${site.name} — ${site.tagline}` };

/** Per-page metadata: unique title/description, canonical, OpenGraph and Twitter cards. */
export function pageMeta({ title, description, path }: { title: string; description: string; path: string }): Metadata {
  const url = absoluteUrl(path);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    // Setting openGraph here replaces the inherited app/opengraph-image, so name the image explicitly.
    openGraph: { title, description, url, siteName: site.name, type: "website", locale: "en_IN", images: [ogImage] },
    twitter: { card: "summary_large_image", title, description, images: [ogImage.url] },
  };
}
