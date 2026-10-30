// Validates data/presets.json against data/tools.json (PLAN.md non-negotiable #4).
//  - unique preset slugs per tool (and unique tool/slug paths overall)
//  - every preset's tool exists in tools.json
//  - verified exam presets have an https sourceUrl and a YYYY-MM-DD verifiedOn that is not in the future
//  - status is "verified" or "needs-review"
import { readFileSync } from "node:fs";

const load = (f) => {
  try {
    return JSON.parse(readFileSync(f, "utf8"));
  } catch (e) {
    console.error(`validate-presets: cannot read ${f}: ${e.message}`);
    process.exit(1);
  }
};

const tools = load("data/tools.json");
const presets = load("data/presets.json");
const errors = [];
const toolSlugs = new Set();

for (const t of tools) {
  if (!t.slug) errors.push(`tool without slug: ${JSON.stringify(t).slice(0, 80)}`);
  else if (toolSlugs.has(t.slug)) errors.push(`duplicate tool slug "${t.slug}"`);
  toolSlugs.add(t.slug);
}

const seen = new Set();
const today = new Date().toISOString().slice(0, 10);
let verified = 0;

for (const p of presets) {
  const id = `${p.tool}/${p.slug}`;
  if (!p.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug)) errors.push(`${id}: slug must be lowercase-hyphenated`);
  if (seen.has(id)) errors.push(`${id}: duplicate preset path`);
  seen.add(id);
  if (toolSlugs.has(p.slug)) errors.push(`${id}: slug collides with a tool slug`);
  if (!toolSlugs.has(p.tool)) errors.push(`${id}: tool "${p.tool}" not in tools.json`);
  if (p.status !== "verified" && p.status !== "needs-review") errors.push(`${id}: bad status "${p.status}"`);
  if (p.status !== "verified") continue;
  verified++;
  if (p.kind === "exam") {
    if (!p.sourceUrl || !/^https:\/\//.test(p.sourceUrl)) errors.push(`${id}: verified exam preset needs an https sourceUrl`);
    if (!p.verifiedOn || !/^\d{4}-\d{2}-\d{2}$/.test(p.verifiedOn) || Number.isNaN(Date.parse(p.verifiedOn)))
      errors.push(`${id}: verified exam preset needs verifiedOn (YYYY-MM-DD)`);
    else if (p.verifiedOn > today) errors.push(`${id}: verifiedOn ${p.verifiedOn} is in the future`);
  }
}

if (errors.length) {
  console.error(`validate-presets: ${errors.length} problem(s):`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log(
  `validate-presets: OK — ${tools.length} tools, ${presets.length} presets (${verified} verified, ${presets.length - verified} needs-review).`,
);
