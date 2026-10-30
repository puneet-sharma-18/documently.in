import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export const dynamic = "force-static";

// Search engines and AI search/answer crawlers we explicitly welcome (one block each).
const AGENTS = [
  "Googlebot",
  "Bingbot",
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "PerplexityBot",
  "ClaudeBot",
  "Claude-SearchBot",
  "anthropic-ai",
  "Google-Extended",
  "Applebot-Extended",
  "*",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: AGENTS.map((userAgent) => ({ userAgent, allow: "/", disallow: ["/admin/", "/api/"] })),
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
