// Generates PWA icons, favicon and the default Open Graph image from the logo in components/SiteHeader.tsx.
// Run manually after changing the logo: `node scripts/generate-icons.mjs` (uses sharp, bundled with Next.js).
// Outputs are committed, so CI never needs to run this.
import { mkdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const INK = "#0f1112";
const LIME = "#d4f54a";

// Same geometry as <Logo/> in components/Brand.tsx (32×32 viewBox).
const glyph = `<path d="M10 7h8l5 5v13H10z" fill="#fff"/><path d="M18 7v5h5" fill="${LIME}"/>
<path d="M13.5 17.5l2.5 2.5 4-4.5" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;

const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="9" fill="${INK}"/>${glyph}</svg>`;

// Maskable: full-bleed ink, glyph scaled into the 80% safe zone.
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="${INK}"/>
<g transform="translate(16 16) scale(0.78) translate(-16.5 -16)">${glyph}</g></svg>`;

// Share card: the sky hero with clouds, white headline and a lime pill.
const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a63c4"/><stop offset="0.4" stop-color="#3f8de0"/><stop offset="0.72" stop-color="#7dbbf0"/><stop offset="1" stop-color="#cfe6fb"/></linearGradient>
<radialGradient id="cloud"><stop offset="0" stop-color="#fff" stop-opacity="0.95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
</defs>
<rect width="1200" height="630" fill="url(#sky)"/>
<ellipse cx="160" cy="640" rx="420" ry="150" fill="url(#cloud)"/>
<ellipse cx="660" cy="660" rx="380" ry="140" fill="url(#cloud)"/>
<ellipse cx="1110" cy="630" rx="400" ry="160" fill="url(#cloud)"/>
<g transform="translate(96 84) scale(2.5)"><rect width="32" height="32" rx="9" fill="${INK}"/>${glyph}</g>
<text x="194" y="135" font-family="Helvetica, Arial, sans-serif" font-size="44" font-weight="700" fill="#fff">documently<tspan fill-opacity="0.7">.in</tspan></text>
<text x="96" y="282" font-family="Helvetica, Arial, sans-serif" font-size="72" font-weight="700" letter-spacing="-2" fill="#fff">Free PDF &amp; photo tools</text>
<text x="96" y="364" font-family="Helvetica, Arial, sans-serif" font-size="72" font-weight="700" letter-spacing="-2" fill="${LIME}">for every Indian form</text>
<rect x="96" y="414" width="488" height="60" rx="30" fill="${INK}"/>
<text x="126" y="452" font-family="Menlo, monospace" font-size="22" font-weight="700" letter-spacing="2" fill="#fff">FREE · NO SIGNUP · NO UPLOAD</text>
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
