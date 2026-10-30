// Guides (blog posts) are Markdown files in content/guides/<slug>.md, read at build time only.
// scripts/validate-guides.mjs enforces the frontmatter contract and quality gates before every build.
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { Marked } from "marked";
import type { Faq } from "./data";

export type Source = { label: string; url: string };

export type Guide = {
  slug: string;
  title: string;
  /** H1 on the page; defaults to `title`. */
  h1: string;
  description: string;
  /** ISO date first published. */
  date: string;
  /** ISO date last meaningfully updated. */
  updated: string;
  primaryKeyword: string;
  /** The tool this guide sends readers to (CTA at the top). */
  tool: string;
  related: string[];
  sources: Source[];
  faqs: Faq[];
  html: string;
  words: number;
};

const DIR = path.join(process.cwd(), "content/guides");

const md = new Marked({ gfm: true });
md.use({
  renderer: {
    // Markdown only: raw HTML in a post is dropped (the validator also rejects it).
    html: () => "",
    link({ href, tokens }) {
      const text = this.parser.parseInline(tokens);
      const external = /^https?:\/\//.test(href) && !href.startsWith("https://documently.in");
      return external ? `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>` : `<a href="${href}">${text}</a>`;
    },
  },
});

// YAML parses an unquoted 2026-11-01 into a Date.
const isoDate = (v: unknown) => (v instanceof Date ? v.toISOString() : String(v)).slice(0, 10);

function load(file: string): Guide {
  const { data, content } = matter(fs.readFileSync(path.join(DIR, file), "utf8"));
  return {
    slug: file.replace(/\.md$/, ""),
    title: data.title,
    h1: data.h1 ?? data.title,
    description: data.description,
    date: isoDate(data.date),
    updated: isoDate(data.updated ?? data.date),
    primaryKeyword: data.primaryKeyword,
    tool: data.tool,
    related: data.related ?? [],
    sources: data.sources ?? [],
    faqs: data.faqs ?? [],
    html: md.parse(content, { async: false }),
    words: content.split(/\s+/).filter(Boolean).length,
  };
}

let cache: Guide[] | null = null;

/** Published guides, newest first. Posts dated in the future stay unpublished until a build on/after that date. */
export function getGuides(): Guide[] {
  if (cache) return cache;
  // Posts are dated in IST; UTC would hide a post published between 00:00 and 05:30 IST.
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const files = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => f.endsWith(".md")) : [];
  cache = files
    .map(load)
    .filter((g) => g.date <= today)
    .sort((a, b) => b.date.localeCompare(a.date));
  return cache;
}

export function getGuide(slug: string) {
  return getGuides().find((g) => g.slug === slug);
}

export function guidesForTool(tool: string) {
  return getGuides().filter((g) => g.tool === tool || g.related.includes(tool));
}
