// Pings IndexNow (Bing, Yandex, Seznam, Naver…) with every URL in out/sitemap.xml.
// Usage (after a deploy is live):  INDEXNOW_KEY=<your-key> node scripts/indexnow.mjs [--dry-run]
//
// One-time key setup:
//   1. Generate a key: `node -e "console.log(crypto.randomUUID().replace(/-/g,''))"`
//   2. Create public/<key>.txt whose ONLY content is the key, commit and deploy it, so that
//      https://documently.in/<key>.txt returns the key (this proves you own the host).
//   3. Store the key as INDEXNOW_KEY (local env, or a GitHub Actions secret if automated).
import { readFileSync, existsSync } from "node:fs";

const HOST = "documently.in";
const key = process.env.INDEXNOW_KEY;
const dry = process.argv.includes("--dry-run");

if (!key || !/^[A-Za-z0-9-]{8,128}$/.test(key)) {
  console.error("indexnow: set INDEXNOW_KEY (8–128 chars, letters/digits/dashes). See header comment for setup.");
  process.exit(1);
}
if (!existsSync("out/sitemap.xml")) {
  console.error("indexnow: out/sitemap.xml not found — run `npm run build` first.");
  process.exit(1);
}

const urls = [...readFileSync("out/sitemap.xml", "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const keyLocation = `https://${HOST}/${key}.txt`;

if (!dry) {
  const check = await fetch(keyLocation).catch(() => null);
  const body = check?.ok ? (await check.text()).trim() : "";
  if (body !== key) {
    console.error(`indexnow: ${keyLocation} must be live and contain exactly the key. Deploy public/${key}.txt first.`);
    process.exit(1);
  }
}

for (let i = 0; i < urls.length; i += 10000) {
  const urlList = urls.slice(i, i + 10000);
  const payload = { host: HOST, key, keyLocation, urlList };
  if (dry) {
    console.log(`indexnow (dry run): would submit ${urlList.length} URLs`, urlList.slice(0, 5));
    continue;
  }
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
  });
  console.log(`indexnow: submitted ${urlList.length} URLs → HTTP ${res.status} ${res.statusText}`);
  if (res.status >= 400) {
    console.error(await res.text());
    process.exit(1);
  }
}
