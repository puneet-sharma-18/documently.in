import toolsJson from "@/data/tools.json";
import presetsJson from "@/data/presets.json";

export type Section = { heading: string; paragraphs?: string[]; bullets?: string[] };
export type Faq = { q: string; a: string };

export type Tool = {
  slug: string;
  name: string;
  category: "pdf" | "image";
  short: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  /** Answer-first summary (1–2 sentences) shown under the H1 — written to be quotable by AI search. */
  answer: string;
  intro: string;
  steps: string[];
  sections: Section[];
  faqs: Faq[];
  related: string[];
  updated: string;
};

/** One upload item an exam asks for (photo, signature, thumb impression…). */
export type ExamItem = {
  key: string;
  label: string;
  widthPx: number | null;
  heightPx: number | null;
  widthCm: number | null;
  heightCm: number | null;
  minKB: number | null;
  maxKB: number | null;
  format: string;
  dpi: number | null;
  /** Shown in the spec table when the notice gives a range rather than exact px/cm. */
  dimensions?: string;
  rules: string[];
  /** Pixel size we output. Equals the official size when one is prescribed, else a safe default we explain in `outputNote`. */
  outWidth: number;
  outHeight: number;
  outputNote?: string;
};

export type Preset = {
  slug: string;
  tool: string;
  kind: "size" | "exam";
  chip: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  answer: string;
  intro: string;
  updated: string;
  /** Tool configuration the page pre-applies (target KB, dimensions, exam items). */
  config: {
    targetKB?: number;
    widthPx?: number;
    heightPx?: number;
    minKB?: number;
    maxKB?: number;
    dpi?: number;
    items?: ExamItem[];
  };
  authority?: string;
  exam?: string;
  sourceUrl?: string;
  sourceLabel?: string;
  verifiedOn?: string;
  status: "verified" | "needs-review";
  steps: string[];
  sections: Section[];
  faqs: Faq[];
  related?: string[];
};

export const tools = toolsJson as Tool[];
const allPresets = presetsJson as Preset[];

/** Only verified presets ever become pages (PLAN.md non-negotiable #4). */
export const presets = allPresets.filter((p) => p.status === "verified");

export function getTool(slug: string) {
  return tools.find((t) => t.slug === slug);
}

export function getPreset(tool: string, slug: string) {
  return presets.find((p) => p.tool === tool && p.slug === slug);
}

export function presetsFor(tool: string) {
  return presets.filter((p) => p.tool === tool);
}

export function presetPath(p: Pick<Preset, "tool" | "slug">) {
  return `/${p.tool}/${p.slug}/`;
}

export const examPresets = presets.filter((p) => p.kind === "exam");
