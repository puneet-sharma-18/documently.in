// Runs public/workers/gs-worker.js in Node (same code the browser runs) against real PDFs.
// Usage: node scripts/test-gs-worker.mjs <file.pdf> <targetKB | unlock:<password> | protect:<password>> [...pairs]
// Prints the chosen resolution, size, and whether the target was reached; unlock/protect outputs are saved next to
// the input as <name>-unlocked.pdf / <name>-protected.pdf.
import { readFileSync, writeFileSync } from "node:fs";
import vm from "node:vm";

const gsJs = readFileSync("public/vendor/gs/gs.js", "utf8");
const workerJs = readFileSync("public/workers/gs-worker.js", "utf8");
const wasmBytes = readFileSync("public/vendor/gs/gs.wasm");

function loadWorker() {
  const messages = [];
  const ctx = {
    console,
    WebAssembly,
    Uint8Array,
    ArrayBuffer,
    Promise,
    Math,
    String,
    Boolean,
    Error,
    TextDecoder,
    setTimeout,
    fetch: async () => new Response(wasmBytes, { headers: { "content-type": "application/wasm" } }),
    postMessage: (m) => messages.push(m),
    location: { href: "http://localhost/workers/gs-worker.js" },
  };
  ctx.self = ctx;
  ctx.importScripts = () => vm.runInContext(gsJs, ctx);
  vm.createContext(ctx);
  vm.runInContext(workerJs, ctx);
  return { ctx, messages };
}

const args = process.argv.slice(2);
for (let i = 0; i < args.length; i += 2) {
  const file = args[i];
  const pw = args[i + 1].match(/^(unlock|protect):(.*)$/s);
  const unlock = Boolean(pw);
  const targetKB = Number(args[i + 1]);
  const { ctx, messages } = loadWorker();
  const bytes = readFileSync(file);
  const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length);
  const t0 = Date.now();
  const job = pw ? { bytes: ab, mode: pw[1], password: pw[2] } : { bytes: ab, mode: "target", targetKB };
  await ctx.onmessage({ data: { id: 1, job } });
  const res = messages.find((m) => m.result || m.error);
  if (res.error) {
    console.log(`${file.split("/").pop()} ${args[i + 1]}: ERROR ${res.error}`);
    continue;
  }
  if (unlock) {
    const outPath = file.replace(/\.pdf$/, pw[1] === "protect" ? "-protected.pdf" : "-unlocked.pdf");
    writeFileSync(outPath, new Uint8Array(res.result.bytes));
    console.log(`${file.split("/").pop()} ${args[i + 1]}: ${(bytes.length / 1000).toFixed(1)}KB -> ${(res.result.bytes.byteLength / 1000).toFixed(1)}KB, saved ${outPath.split("/").pop()}, ${Date.now() - t0}ms`);
    continue;
  }
  const { bytes: out, resolution, reachedTarget } = res.result;
  const passes = messages.filter((m) => m.progress && /Pass/.test(m.progress)).map((m) => m.progress.match(/(\d+) dpi/)[1]);
  console.log(
    `${file.split("/").pop()} @${targetKB}KB: ${(bytes.length / 1000).toFixed(0)}KB -> ${(out.byteLength / 1000).toFixed(1)}KB, ` +
      `images ${resolution} dpi, reachedTarget=${reachedTarget}, passes=[${passes.join(",")}], ${Date.now() - t0}ms`,
  );
}
