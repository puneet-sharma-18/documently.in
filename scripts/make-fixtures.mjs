// Generates test files for manually exercising every tool: `node scripts/make-fixtures.mjs <outDir>`.
// Photos are noisy gradients so they compress like real phone pictures.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import createGs from "@jspawn/ghostscript-wasm";

const out = process.argv[2];
if (!out) throw new Error("usage: node scripts/make-fixtures.mjs <outDir>");
mkdirSync(out, { recursive: true });

function noisyPhoto(w, h, amp) {
  const px = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      const n = () => (Math.random() - 0.5) * amp;
      px[i] = Math.max(0, Math.min(255, 120 + 100 * Math.sin(x / 300) + n()));
      px[i + 1] = Math.max(0, Math.min(255, 140 + 80 * Math.cos(y / 250) + n()));
      px[i + 2] = Math.max(0, Math.min(255, 160 + 60 * Math.sin((x + y) / 400) + n()));
    }
  return sharp(px, { raw: { width: w, height: h, channels: 3 } });
}

const photo = await noisyPhoto(3000, 4000, 60).jpeg({ quality: 92 }).toBuffer();
writeFileSync(join(out, "phone-photo.jpg"), photo);
writeFileSync(join(out, "screenshot.png"), await noisyPhoto(1200, 1600, 20).png().toBuffer());
writeFileSync(join(out, "signature-scan.jpg"), await noisyPhoto(1800, 700, 15).jpeg({ quality: 90 }).toBuffer());

// "Scanned" 6-page A4 PDF: one 200-DPI page image per page.
// Each page embeds its own image so the file is realistically big.
const scanBig = await PDFDocument.create();
for (let i = 0; i < 6; i++) {
  const img = await scanBig.embedJpg(await noisyPhoto(1654, 2339, 40).jpeg({ quality: 85 }).toBuffer());
  scanBig.addPage([595.28, 841.89]).drawImage(img, { x: 0, y: 0, width: 595.28, height: 841.89 });
}
writeFileSync(join(out, "scanned-6-pages.pdf"), await scanBig.save());

// Text-only PDF (already small).
const text = await PDFDocument.create();
const font = await text.embedFont(StandardFonts.Helvetica);
for (let i = 1; i <= 3; i++) {
  const p = text.addPage([595.28, 841.89]);
  p.drawText(`Documently test page ${i}`, { x: 60, y: 760, size: 24, font, color: rgb(0.05, 0.4, 0.33) });
  p.drawText("Plain text page used to test merge, split and rotate.", { x: 60, y: 720, size: 12, font });
}
const textBytes = await text.save();
writeFileSync(join(out, "text-3-pages.pdf"), textBytes);

// Password-protected copy via Ghostscript.
const wasm = await WebAssembly.compile(readFileSync("node_modules/@jspawn/ghostscript-wasm/gs.wasm"));
const gs = await createGs({
  noInitialRun: true,
  instantiateWasm: (imports, done) => {
    WebAssembly.instantiate(wasm, imports).then((instance) => done(instance));
    return {};
  },
});
gs.FS.writeFile("/in.pdf", textBytes);
gs.callMain(["-sDEVICE=pdfwrite", "-dNOPAUSE", "-dBATCH", "-dQUIET", "-sOwnerPassword=owner123", "-sUserPassword=user123", "-sOutputFile=/out.pdf", "/in.pdf"]);
writeFileSync(join(out, "password-protected.pdf"), gs.FS.readFile("/out.pdf"));

writeFileSync(join(out, "not-a-pdf.pdf"), "this is plain text pretending to be a PDF");
console.log("fixtures written to", out);
