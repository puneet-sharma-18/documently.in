import { tools, presets, presetPath, type Preset } from "@/lib/data";
import { getGuides } from "@/lib/guides";
import { absoluteUrl, site } from "@/lib/site";

// Rendered once at build into out/llms.txt (static export supports GET route handlers with force-static).
export const dynamic = "force-static";

function spec(p: Preset): string {
  const c = p.config || {};
  const parts: string[] = [];
  if (c.items?.length) {
    for (const it of c.items) {
      const bits = [
        it.widthPx && it.heightPx
          ? `${it.widthPx}×${it.heightPx}px`
          : it.widthCm && it.heightCm
            ? `${it.widthCm}×${it.heightCm}cm`
            : "",
        it.minKB != null || it.maxKB != null ? `${it.minKB ?? 0}–${it.maxKB ?? "?"} KB` : "",
        it.format ? it.format.toUpperCase() : "",
      ].filter(Boolean);
      parts.push(`${it.label}: ${bits.join(", ")}`);
    }
  } else {
    if (c.targetKB) parts.push(`under ${c.targetKB} KB`);
    if (c.minKB != null || c.maxKB != null) parts.push(`${c.minKB ?? 0}–${c.maxKB ?? "?"} KB`);
    if (c.widthPx && c.heightPx) parts.push(`${c.widthPx}×${c.heightPx}px`);
    if (c.dpi) parts.push(`${c.dpi} DPI`);
  }
  if (p.verifiedOn) parts.push(`verified ${p.verifiedOn}`);
  return parts.join("; ");
}

export function GET() {
  const lines = [
    `# ${site.name} (${site.domain})`,
    "",
    `> ${site.tagline}. Free, no-signup, mobile-first tools that compress, resize and convert PDFs and photos to the exact size Indian exam, job and government forms ask for.`,
    "",
    "Privacy: every tool runs entirely in the user's browser (JavaScript/WebAssembly). Files are never uploaded to any server; only anonymous usage metadata (tool, file sizes, success/error) is recorded.",
    "",
    "Exam presets are published only when the limit is found in the official notification or portal; each page links the source and shows a verified-on date. Users should always confirm against the current official notification.",
    "",
    "## Tools",
    "",
    ...tools.map((t) => `- [${t.name}](${absoluteUrl(`/${t.slug}/`)}): ${t.short}`),
    "",
    "## Size and exam presets",
    "",
    ...presets.map((p) => `- [${p.h1}](${absoluteUrl(presetPath(p))}): ${spec(p) || p.metaDescription}`),
    "",
    "## Guides",
    "",
    ...getGuides().map((g) => `- [${g.h1}](${absoluteUrl(`/guides/${g.slug}/`)}): ${g.description}`),
    "",
    "## About and policies",
    "",
    `- [About](${absoluteUrl("/about/")}): who runs Documently and how presets are verified`,
    `- [Privacy Policy](${absoluteUrl("/privacy/")}): in-browser processing, anonymous usage data, cookies`,
    `- [Terms of Use](${absoluteUrl("/terms/")})`,
    `- [Disclaimer](${absoluteUrl("/disclaimer/")}): not affiliated with any exam authority`,
    `- [Contact](${absoluteUrl("/contact/")}): ${site.email}`,
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "content-type": "text/plain; charset=utf-8" } });
}
