import { notFound } from "next/navigation";
import ToolPage from "@/components/ToolPage";
import { getPreset, getTool, presets, presetPath } from "@/lib/data";
import { pageMeta } from "@/lib/meta";

export const dynamicParams = false;

export function generateStaticParams() {
  return presets.map((p) => ({ tool: p.tool, preset: p.slug }));
}

type Params = Promise<{ tool: string; preset: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { tool, preset: slug } = await params;
  const preset = getPreset(tool, slug);
  if (!preset) return {};
  return pageMeta({ title: preset.metaTitle, description: preset.metaDescription, path: presetPath(preset) });
}

export default async function Page({ params }: { params: Params }) {
  const { tool: toolSlug, preset: slug } = await params;
  const tool = getTool(toolSlug);
  const preset = getPreset(toolSlug, slug);
  if (!tool || !preset) notFound();
  return <ToolPage tool={tool} preset={preset} />;
}
