// Runs public/workers/gs-worker.js in Node (same code the browser runs) against real PDFs.
// Usage: node scripts/test-gs-worker.mjs <file.pdf> <targetKB> [<file.pdf> <targetKB> ...]
// Prints the chosen resolution, size, and whether the target was reached.
import { readFileSync } from "node:fs";
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
  const targetKB = Number(args[i + 1]);
  const { ctx, messages } = loadWorker();
  const bytes = readFileSync(file);
  const t0 = Date.now();
  await ctx.onmessage({ data: { id: 1, job: { bytes: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length), mode: "target", targetKB } } });
  const res = messages.find((m) => m.result || m.error);
  if (res.error) {
    console.log(`${file} @${targetKB}KB: ERROR ${res.error}`);
    continue;
  }
  const { bytes: out, resolution, reachedTarget } = res.result;
  const passes = messages.filter((m) => m.progress && /Pass/.test(m.progress)).map((m) => m.progress.match(/(\d+) dpi/)[1]);
  console.log(
    `${file.split("/").pop()} @${targetKB}KB: ${(bytes.length / 1000).toFixed(0)}KB -> ${(out.byteLength / 1000).toFixed(1)}KB, ` +
      `images ${resolution} dpi, reachedTarget=${reachedTarget}, passes=[${passes.join(",")}], ${Date.now() - t0}ms`,
  );
}
