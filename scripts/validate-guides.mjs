// Quality gate for content/guides/*.md. Runs before every build (npm prebuild), so a post that fails
// never deploys. These rules are what keep a daily cadence from reading as scaled, low-value content.
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const DIR = "content/guides";
const tools = JSON.parse(fs.readFileSync("data/tools.json", "utf8"));
const presets = JSON.parse(fs.readFileSync("data/presets.json", "utf8"));
const toolSlugs = new Set(tools.map((t) => t.slug));
const presetPaths = new Set(presets.filter((p) => p.status === "verified").map((p) => `/${p.tool}/${p.slug}/`));

const BANNED = [
  // Filler that marks generic machine copy.
  /\bdelve\b/i, /in today'?s (digital|fast-paced)/i, /\bgame[- ]changer\b/i, /unlock the (power|potential)/i,
  /\bseamless(ly)?\b/i, /\bin conclusion\b/i, /\bembark\b/i, /\bnavigat(e|ing) the (world|landscape)\b/i, /\btestament to\b/i,
  // Claims we never make.
  /\bAI[- ]powered\b/i, /\b100% (accurate|guaranteed)\b/i, /\bguaranteed (approval|acceptance)\b/i,
  // Competitors are never named.
  /\bilovepdf\b/i, /\bsmallpdf\b/i, /\bsejda\b/i, /\bpi7\b/i, /\badobe acrobat online\b/i,
  // Invented-statistic shapes: "73% of candidates", "thousands of students trust".
  /\b\d{1,3}(\.\d+)?% of (students|candidates|users|applicants|people|forms)\b/i, /\b(thousands|lakhs|millions) of (students|users|candidates) (use|trust)/i,
];

const errors = [];
const fail = (f, m) => errors.push(`${f}: ${m}`);
const files = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => f.endsWith(".md")) : [];
const seen = { title: new Map(), keyword: new Map() };
const guideSlugs = new Set(files.map((f) => f.replace(/\.md$/, "")));

for (const file of files) {
  const slug = file.replace(/\.md$/, "");
  const { data: d, content } = matter(fs.readFileSync(path.join(DIR, file), "utf8"));
  const words = content.split(/\s+/).filter(Boolean).length;

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) fail(file, "slug must be lowercase-kebab-case");
  if (toolSlugs.has(slug)) fail(file, "slug collides with a tool page");
  for (const k of ["title", "description", "date", "primaryKeyword", "tool"]) if (!d[k]) fail(file, `missing frontmatter "${k}"`);
  if (d.title && d.title.length > 60) fail(file, `title is ${d.title.length} chars (max 60)`);
  if (d.description && (d.description.length < 110 || d.description.length > 155)) fail(file, `description is ${d.description.length} chars (110–155)`);
  for (const k of ["date", "updated"]) if (d[k] && !/^\d{4}-\d{2}-\d{2}$/.test(String(d[k] instanceof Date ? d[k].toISOString().slice(0, 10) : d[k]))) fail(file, `${k} must be YYYY-MM-DD`);
  if (d.tool && !toolSlugs.has(d.tool)) fail(file, `tool "${d.tool}" is not a tool slug`);
  for (const r of d.related ?? []) if (!toolSlugs.has(r) && !presetPaths.has(`/${r}/`)) fail(file, `related "${r}" is not a tool or verified preset`);

  if (words < 600 || words > 1800) fail(file, `${words} words (600–1800)`);
  if ((content.match(/^## /gm) ?? []).length < 2) fail(file, "needs at least two ## sections");
  if (/<[a-zA-Z!/]/.test(content.replace(/`[^`]*`/g, ""))) fail(file, "raw HTML is not allowed; use Markdown");
  if (/^# /m.test(content)) fail(file, "no # H1 in the body; the page renders the title as H1");

  // Every internal link must resolve, and the post must send readers to at least one tool.
  const internal = [...content.matchAll(/\]\((\/[^)\s#]*)/g)].map((m) => m[1]);
  for (const href of internal) {
    const p = href.endsWith("/") ? href : `${href}/`;
    const ok = p === "/" || toolSlugs.has(p.slice(1, -1)) || presetPaths.has(p) || (p.startsWith("/guides/") && guideSlugs.has(p.slice(8, -1))) || p === "/guides/";
    if (!ok) fail(file, `internal link ${href} does not resolve`);
  }
  if (!internal.some((h) => toolSlugs.has(h.replace(/^\/|\/$/g, "").split("/")[0]))) fail(file, "must link to at least one tool page");

  const sources = d.sources ?? [];
  if (!sources.length) fail(file, "needs at least one source");
  for (const s of sources) if (!s?.label || !/^https:\/\//.test(s?.url ?? "")) fail(file, `bad source ${JSON.stringify(s)}`);
  const faqs = d.faqs ?? [];
  if (faqs.length < 2 || faqs.length > 5) fail(file, `${faqs.length} FAQs (2–5)`);
  for (const f of faqs) if (!f?.q || !f?.a) fail(file, "FAQ needs q and a");

  const text = [d.title, d.description, content, ...faqs.flatMap((f) => [f.q, f.a])].join("\n");
  for (const re of BANNED) if (re.test(text)) fail(file, `banned phrase ${re}`);

  for (const [k, v] of [["title", d.title?.toLowerCase()], ["keyword", d.primaryKeyword?.toLowerCase().trim()]]) {
    if (!v) continue;
    if (seen[k].has(v)) fail(file, `duplicate ${k} with ${seen[k].get(v)} (cannibalisation)`);
    seen[k].set(v, file);
  }
}

if (errors.length) {
  console.error(`\nvalidate-guides: ${errors.length} problem(s):\n`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log(`validate-guides: OK — ${files.length} guide(s).`);
