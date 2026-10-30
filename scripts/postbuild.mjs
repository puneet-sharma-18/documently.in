// Post-build quality gate over the static export in out/. Runs automatically after `next build`.
//  1. Internal link checker: every internal href/src must resolve to a file in out/.
//  2. Page checks: exactly one <h1>, <title>, meta description; indexable pages also need a canonical,
//     og:title and og:image. Warns (doesn't fail) on title > 60 / description > 160 chars.
//  3. Every JSON-LD block parses as JSON.
//  4. sitemap.xml, robots.txt and llms.txt exist; the sitemap contains no needs-review presets.
// Exits non-zero with a report on any failure.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, dirname, posix } from "node:path";

const OUT = "out";
const errors = [];
const warnings = [];
const fail = (file, msg) => errors.push(`${file}: ${msg}`);
const warn = (file, msg) => warnings.push(`${file}: ${msg}`);

if (!existsSync(OUT)) {
  console.error("postbuild: out/ not found — did `next build` run with output: \"export\"?");
  process.exit(1);
}

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

const decode = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .trim();

/** Map an absolute site path to a file in out/ (trailing-slash dirs → index.html). */
function resolves(urlPath) {
  let p;
  try {
    p = decodeURIComponent(urlPath);
  } catch {
    p = urlPath;
  }
  const local = join(OUT, p);
  if (p.endsWith("/")) return existsSync(join(local, "index.html"));
  if (existsSync(local) && statSync(local).isFile()) return true;
  return existsSync(join(local, "index.html")) || existsSync(`${local}.html`);
}

function meta(html, attr, value) {
  const re = new RegExp(`<meta[^>]+${attr}=["']${value}["'][^>]*>`, "i");
  const tag = html.match(re)?.[0];
  if (!tag) return null;
  return decode(tag.match(/content=["']([^"']*)["']/i)?.[1] ?? "");
}

const files = walk(OUT);
const htmlFiles = files.filter((f) => f.endsWith(".html"));
let linksChecked = 0;

for (const file of htmlFiles) {
  const rel = relative(OUT, file);
  const html = readFileSync(file, "utf8");
  const dirParts = dirname(rel).split(/[\\/]/).filter((s) => s && s !== ".");
  const pagePath = dirParts.length ? `/${dirParts.join("/")}/` : "/";
  const noindex = /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html);
  const isErrorPage = /^(404|500)\.html$|^_not-found[\\/]/.test(rel);

  // --- 1. links
  for (const m of html.matchAll(/\s(?:href|src)=["']([^"']+)["']/gi)) {
    let url = decode(m[1]);
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(url)) {
      // absolute URL: only check ones pointing at our own domain
      const own = url.match(/^https?:\/\/(?:www\.)?documently\.in(\/[^\s]*)?$/i);
      if (!own) continue;
      url = own[1] || "/";
    }
    url = url.split("#")[0].split("?")[0];
    if (!url) continue;
    if (!url.startsWith("/")) url = posix.join(pagePath, url) + (url.endsWith("/") ? "/" : "");
    if (url.startsWith("/api/") || url.startsWith("/cdn-cgi/")) continue;
    linksChecked++;
    if (!resolves(url)) fail(rel, `broken internal link ${m[1]}`);
  }

  // --- 2. page checks
  const h1s = (html.match(/<h1[\s>]/gi) || []).length;
  if (h1s !== 1) fail(rel, `expected exactly one <h1>, found ${h1s}`);

  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  if (!title || !decode(title)) fail(rel, "missing <title>");
  else if (decode(title).length > 60) warn(rel, `title is ${decode(title).length} chars (>60): "${decode(title)}"`);

  const desc = meta(html, "name", "description");
  if (!desc) fail(rel, "missing meta description");
  else if (desc.length > 160) warn(rel, `meta description is ${desc.length} chars (>160)`);

  if (!noindex && !isErrorPage) {
    if (!/<link[^>]+rel=["']canonical["'][^>]*>/i.test(html)) fail(rel, "missing canonical link");
    if (!meta(html, "property", "og:title")) fail(rel, "missing og:title");
    if (!meta(html, "property", "og:image")) fail(rel, "missing og:image");
  }

  // --- 3. JSON-LD
  for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      JSON.parse(m[1]);
    } catch (e) {
      fail(rel, `JSON-LD does not parse: ${e.message}`);
    }
  }
}

// --- 4. sitemap / robots / llms.txt
const sitemapPath = join(OUT, "sitemap.xml");
if (!existsSync(sitemapPath)) fail("sitemap.xml", "missing");
else {
  const xml = readFileSync(sitemapPath, "utf8");
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (!locs.length) fail("sitemap.xml", "contains no URLs");
  for (const loc of locs) {
    const path = loc.replace(/^https?:\/\/[^/]+/, "") || "/";
    if (!resolves(path)) fail("sitemap.xml", `URL has no page in out/: ${loc}`);
  }
  let presets = [];
  try {
    presets = JSON.parse(readFileSync("data/presets.json", "utf8"));
  } catch (e) {
    fail("data/presets.json", `cannot read: ${e.message}`);
  }
  for (const p of presets) {
    if (p.status === "verified") continue;
    const path = `/${p.tool}/${p.slug}/`;
    if (locs.some((l) => l.endsWith(path))) fail("sitemap.xml", `contains needs-review preset ${path}`);
    if (resolves(path)) fail(`${p.tool}/${p.slug}`, "needs-review preset was built into a page");
  }
}
for (const f of ["robots.txt", "llms.txt", "manifest.webmanifest"]) {
  if (!existsSync(join(OUT, f))) fail(f, "missing from out/");
}

// --- report
for (const w of warnings) console.warn(`  warn  ${w}`);
if (errors.length) {
  console.error(`\npostbuild: ${errors.length} problem(s) in ${htmlFiles.length} pages:\n`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  console.error("");
  process.exit(1);
}
console.log(
  `postbuild: OK — ${htmlFiles.length} pages, ${linksChecked} internal links, ${warnings.length} warning(s).`,
);
