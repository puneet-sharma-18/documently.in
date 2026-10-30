/*
 * PDF compression worker. Runs Ghostscript compiled to WebAssembly
 * (@jspawn/ghostscript-wasm, AGPL-3.0 — see /vendor/gs/LICENSE) entirely in the browser.
 * Documently's own source is published under AGPL-3.0: https://github.com/puneet-sharma-18/documently.in
 *
 * Message in:  { id, job: { bytes: ArrayBuffer, mode: "level" | "target", level?: "high"|"balanced"|"small", targetKB?: number, gray?: boolean } }
 * Message out: { id, progress } … then { id, result: { bytes, resolution, reachedTarget } } or { id, error }
 */
importScripts("/vendor/gs/gs.js");

var compiledWasm = null;

function getWasm() {
  if (!compiledWasm) {
    compiledWasm = WebAssembly.compileStreaming(fetch("/vendor/gs/gs.wasm")).catch(function () {
      // Some static hosts send the wrong MIME type for .wasm; fall back to a plain compile.
      return fetch("/vendor/gs/gs.wasm")
        .then(function (r) {
          return r.arrayBuffer();
        })
        .then(function (buf) {
          return WebAssembly.compile(buf);
        });
    });
  }
  return compiledWasm;
}

// Ladder from gentle to aggressive: image resolution (dpi) and JPEG QFactor (higher = smaller, blurrier).
var LADDER = [
  { dpi: 150, q: 0.4 },
  { dpi: 120, q: 0.76 },
  { dpi: 100, q: 0.76 },
  { dpi: 85, q: 0.9 },
  { dpi: 72, q: 1.0 },
  { dpi: 60, q: 1.3 },
  { dpi: 50, q: 1.6 },
  { dpi: 40, q: 2.0 },
];
var LEVELS = { high: 0, balanced: 2, small: 4 };

function gsArgs(step, gray) {
  var r = String(step.dpi);
  var dict =
    "<< /QFactor " + step.q + " /Blend 1 /HSamples [2 1 1 2] /VSamples [2 1 1 2] >>";
  var args = [
    "-sDEVICE=pdfwrite",
    "-dCompatibilityLevel=1.5",
    "-dNOPAUSE",
    "-dQUIET",
    "-dBATCH",
    "-dSAFER",
    "-dDetectDuplicateImages=true",
    "-dCompressFonts=true",
    "-dSubsetFonts=true",
    "-dDownsampleColorImages=true",
    "-dColorImageDownsampleType=/Bicubic",
    "-dColorImageResolution=" + r,
    "-dColorImageDownsampleThreshold=1.0",
    "-dDownsampleGrayImages=true",
    "-dGrayImageDownsampleType=/Bicubic",
    "-dGrayImageResolution=" + r,
    "-dGrayImageDownsampleThreshold=1.0",
    "-dDownsampleMonoImages=true",
    "-dMonoImageResolution=" + String(Math.max(step.dpi * 2, 150)),
    "-dAutoFilterColorImages=false",
    "-dColorImageFilter=/DCTEncode",
    "-dAutoFilterGrayImages=false",
    "-dGrayImageFilter=/DCTEncode",
  ];
  if (gray) {
    args.push("-sColorConversionStrategy=Gray", "-dProcessColorModel=/DeviceGray");
  }
  args.push(
    "-sOutputFile=/out.pdf",
    "-c",
    "<< /ColorImageDict " + dict + " /GrayImageDict " + dict + " >> setdistillerparams",
    "-f",
    "/in.pdf"
  );
  return args;
}

async function runOnce(input, step, gray) {
  var wasm = await getWasm();
  var errors = [];
  var mod = await Module({
    noInitialRun: true,
    print: function () {},
    printErr: function (t) {
      errors.push(t);
    },
    instantiateWasm: function (imports, done) {
      WebAssembly.instantiate(wasm, imports).then(function (instance) {
        done(instance);
      });
      return {};
    },
  });
  mod.FS.writeFile("/in.pdf", input);
  try {
    mod.callMain(gsArgs(step, gray));
  } catch (e) {
    // Emscripten signals exit() by throwing; a missing output file below is the real failure signal.
  }
  var out;
  try {
    out = mod.FS.readFile("/out.pdf");
  } catch (e) {
    out = null;
  }
  var log = errors.join("\n");
  if (!out || out.length === 0) {
    if (/password|encrypt/i.test(log)) throw new Error("This PDF is password-protected.");
    throw new Error(log ? "Couldn't process this PDF: " + log.slice(0, 200) : "Couldn't process this PDF.");
  }
  return out;
}

self.onmessage = async function (e) {
  var id = e.data.id;
  var job = e.data.job;
  var input = new Uint8Array(job.bytes);
  function progress(msg) {
    self.postMessage({ id: id, progress: msg });
  }
  try {
    progress("Loading the compression engine…");
    await getWasm();

    if (job.mode === "level") {
      var step = LADDER[LEVELS[job.level] || 2];
      progress("Compressing…");
      var out = await runOnce(input, step, job.gray);
      self.postMessage({ id: id, result: { bytes: out.buffer, resolution: step.dpi, reachedTarget: true } }, [out.buffer]);
      return;
    }

    // Target mode: walk the ladder, jumping ahead when we're far over the target.
    var target = job.targetKB * 1000 - 1024;
    var best = null;
    var i = 0;
    var pass = 1;
    while (i < LADDER.length) {
      progress("Pass " + pass + " — trying " + LADDER[i].dpi + " dpi images…");
      var result = await runOnce(input, LADDER[i], job.gray);
      if (!best || result.length < best.bytes.length) best = { bytes: result, dpi: LADDER[i].dpi };
      if (result.length <= target || i === LADDER.length - 1) break;
      var ratio = result.length / target;
      i = Math.min(LADDER.length - 1, i + (ratio > 3 ? 3 : ratio > 1.6 ? 2 : 1));
      pass++;
    }
    var reached = best.bytes.length <= target;
    self.postMessage(
      { id: id, result: { bytes: best.bytes.buffer, resolution: best.dpi, reachedTarget: reached } },
      [best.bytes.buffer]
    );
  } catch (err) {
    self.postMessage({ id: id, error: (err && err.message) || String(err) });
  }
};
