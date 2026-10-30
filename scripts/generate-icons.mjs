// Generates PWA icons, favicon and the default Open Graph image from the logo in components/SiteHeader.tsx.
// Run manually after changing the logo: `node scripts/generate-icons.mjs` (uses sharp, bundled with Next.js).
// Outputs are committed, so CI never needs to run this.
import { mkdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const TEAL = "#0e7c66";
const MINT = "#a6dfd1";

// Same geometry as <Logo/> (32×32 viewBox).
const glyph = `<path d="M10 7h8l5 5v13H10z" fill="#fff"/><path d="M18 7v5h5" fill="${MINT}"/>
<path d="M13.5 17.5l2.5 2.5 4-4.5" fill="none" stroke="${TEAL}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;

const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="${TEAL}"/>${glyph}</svg>`;

// Maskable: full-bleed teal, glyph scaled into the 80% safe zone.
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="${TEAL}"/>
<g transform="translate(16 16) scale(0.78) translate(-16.5 -16)">${glyph}</g></svg>`;

const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="#fbfbf9"/>
<rect x="0" y="0" width="1200" height="12" fill="${TEAL}"/>
<g transform="translate(96 112) scale(4)"><rect width="32" height="32" rx="8" fill="${TEAL}"/>${glyph}</g>
<text x="248" y="190" font-family="Helvetica, Arial, sans-serif" font-size="64" font-weight="700" fill="#17201d">documently<tspan fill="${TEAL}">.in</tspan></text>
<text x="96" y="340" font-family="Helvetica, Arial, sans-serif" font-size="58" font-weight="700" fill="#17201d">Free PDF &amp; photo tools</text>
<text x="96" y="410" font-family="Helvetica, Arial, sans-serif" font-size="58" font-weight="700" fill="#17201d">for every Indian form</text>
<text x="96" y="510" font-family="Helvetica, Arial, sans-serif" font-size="32" fill="#5b6662">Compress · Resize · Convert to the exact KB · Files never leave your device</text>
</svg>`;

mkdirSync("public/icons", { recursive: true });
writeFileSync("public/icons/icon.svg", logoSvg);

const png = (svg, size) => sharp(Buffer.from(svg), { density: 1200 }).resize(size, size).png().toBuffer();

writeFileSync("public/icons/icon-192.png", await png(logoSvg, 192));
writeFileSync("public/icons/icon-512.png", await png(logoSvg, 512));
writeFileSync("public/icons/maskable-512.png", await png(maskableSvg, 512));
writeFileSync("app/apple-icon.png", await png(maskableSvg, 180));
writeFileSync("app/opengraph-image.png", await sharp(Buffer.from(ogSvg)).png().toBuffer());

// favicon.ico containing 16/32/48 PNG frames (ICO allows embedded PNGs).
const sizes = [16, 32, 48];
const frames = await Promise.all(sizes.map((s) => png(logoSvg, s)));
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((s, i) => {
  const o = 6 + 16 * i;
  header.writeUInt8(s, o);
  header.writeUInt8(s, o + 1);
  header.writeUInt16LE(1, o + 4);
  header.writeUInt16LE(32, o + 6);
  header.writeUInt32LE(frames[i].length, o + 8);
  header.writeUInt32LE(offset, o + 12);
  offset += frames[i].length;
});
writeFileSync("app/favicon.ico", Buffer.concat([header, ...frames]));

console.log("icons: public/icons/{icon.svg,icon-192.png,icon-512.png,maskable-512.png}, app/{apple-icon.png,opengraph-image.png,favicon.ico}");
