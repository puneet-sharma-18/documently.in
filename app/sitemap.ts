import type { MetadataRoute } from "next";
import { tools, presets, presetPath } from "@/lib/data";
import { absoluteUrl } from "@/lib/site";

// Required for metadata routes under `output: "export"`.
export const dynamic = "force-static";

const LEGAL = ["/about/", "/privacy/", "/terms/", "/contact/", "/disclaimer/"];
const LEGAL_UPDATED = new Date("2026-10-30");

export default function sitemap(): MetadataRoute.Sitemap {
  const built = new Date();
  return [
    { url: absoluteUrl("/"), lastModified: built, changeFrequency: "weekly", priority: 1 },
    ...tools.map((t) => ({
      url: absoluteUrl(`/${t.slug}/`),
      lastModified: built,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    // `presets` is already filtered to status === "verified" in lib/data.ts.
    ...presets.map((p) => ({
      url: absoluteUrl(presetPath(p)),
      lastModified: p.verifiedOn ? new Date(p.verifiedOn) : built,
      changeFrequency: (p.kind === "exam" ? "weekly" : "monthly") as "weekly" | "monthly",
      priority: 0.8,
    })),
    ...LEGAL.map((path) => ({
      url: absoluteUrl(path),
      lastModified: LEGAL_UPDATED,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
