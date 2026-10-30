// Renders PDF pages to JPG with pdf.js. Parsing runs in pdf.js's own worker; drawing uses a canvas.

export type RenderOptions = { dpi: number; quality: number; pages?: number[] };

async function loadPdfjs() {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/vendor/pdfjs/pdf.worker.min.mjs";
  return pdfjs;
}

export async function pdfPageCount(file: Blob) {
  const pdfjs = await loadPdfjs();
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const n = (await task.promise).numPages;
  await task.destroy();
  return n;
}

export async function renderPdfToJpgs(
  file: Blob,
  opts: RenderOptions,
  onProgress?: (done: number, total: number) => void,
): Promise<{ page: number; blob: Blob; width: number; height: number }[]> {
  const pdfjs = await loadPdfjs();
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  let doc;
  try {
    doc = await task.promise;
  } catch (err) {
    await task.destroy();
    if (err instanceof Error && /password/i.test(err.name + err.message)) throw new Error("This PDF is password-protected.");
    throw err;
  }
  const pages = opts.pages?.length ? opts.pages : Array.from({ length: doc.numPages }, (_, i) => i + 1);
  const out: { page: number; blob: Blob; width: number; height: number }[] = [];
  try {
    for (const [i, n] of pages.entries()) {
      const page = await doc.getPage(n);
      // Cap very large pages so phones don't run out of canvas memory (~16 MP).
      let scale = opts.dpi / 72;
      const base = page.getViewport({ scale: 1 });
      const maxPixels = 16_000_000;
      if (base.width * base.height * scale * scale > maxPixels) scale = Math.sqrt(maxPixels / (base.width * base.height));
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvas, canvasContext: ctx, viewport }).promise;
      const blob = await new Promise<Blob>((res, rej) =>
        canvas.toBlob((b) => (b ? res(b) : rej(new Error("Couldn't encode page image"))), "image/jpeg", opts.quality),
      );
      out.push({ page: n, blob, width: canvas.width, height: canvas.height });
      page.cleanup();
      canvas.width = canvas.height = 0;
      onProgress?.(i + 1, pages.length);
    }
  } finally {
    await task.destroy();
  }
  return out;
}
