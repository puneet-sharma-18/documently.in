// Copies browser-side WASM/worker assets into /public so they can be lazy-loaded at runtime.
import { cpSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const copies = [
  ["node_modules/@jspawn/ghostscript-wasm/gs.js", "public/vendor/gs/gs.js"],
  ["node_modules/@jspawn/ghostscript-wasm/gs.wasm", "public/vendor/gs/gs.wasm"],
  ["node_modules/@jspawn/ghostscript-wasm/LICENSE", "public/vendor/gs/LICENSE"],
  ["node_modules/pdfjs-dist/build/pdf.worker.min.mjs", "public/vendor/pdfjs/pdf.worker.min.mjs"],
];

for (const [from, to] of copies) {
  mkdirSync(dirname(to), { recursive: true });
  cpSync(from, to);
}
console.log(`copied ${copies.length} vendor files`);
