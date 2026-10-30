import { notFound } from "next/navigation";
import ToolPage from "@/components/ToolPage";
import { getTool, tools } from "@/lib/data";
import { pageMeta } from "@/lib/meta";

export const dynamicParams = false;

export function generateStaticParams() {
  return tools.map((t) => ({ tool: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ tool: string }> }) {
  const tool = getTool((await params).tool);
  if (!tool) return {};
  return pageMeta({ title: tool.metaTitle, description: tool.metaDescription, path: `/${tool.slug}/` });
}

export default async function Page({ params }: { params: Promise<{ tool: string }> }) {
  const tool = getTool((await params).tool);
  if (!tool) notFound();
  return <ToolPage tool={tool} />;
}
