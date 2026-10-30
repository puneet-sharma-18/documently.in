// pdf-lib operations: merge, split, rotate, images → PDF. Runs inside a Web Worker.
import { PDFDocument, degrees } from "pdf-lib";
import { parseRanges } from "./ranges";

export type PdfJob =
  | { op: "info"; file: Blob }
  | { op: "merge"; files: Blob[] }
  | { op: "split"; file: Blob; mode: "ranges" | "every"; ranges?: string }
  | { op: "rotate"; file: Blob; angle: 90 | 180 | 270; pages?: number[] }
  | {
      op: "images";
      images: Blob[];
      pageSize: "a4" | "fit";
      orientation: "auto" | "portrait" | "landscape";
      marginPt: number;
    };

export type PdfOutput = { name: string; bytes: Uint8Array };
export type PdfResult = { outputs: PdfOutput[]; pageCount: number };

async function load(file: Blob) {
  // pdf-lib throws a clear "encrypted" error for password-protected files; we surface it.
  return PDFDocument.load(await file.arrayBuffer(), { updateMetadata: false });
}

const A4 = { w: 595.28, h: 841.89 };

export async function runPdfJob(job: PdfJob): Promise<PdfResult> {
  switch (job.op) {
    case "info": {
      const doc = await load(job.file);
      return { outputs: [], pageCount: doc.getPageCount() };
    }
    case "merge": {
      const out = await PDFDocument.create();
      for (const f of job.files) {
        const src = await load(f);
        const pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach((p) => out.addPage(p));
      }
      return { outputs: [{ name: "merged.pdf", bytes: await out.save() }], pageCount: out.getPageCount() };
    }
    case "split": {
      const src = await load(job.file);
      const n = src.getPageCount();
      const groups =
        job.mode === "every" ? src.getPageIndices().map((i) => [i]) : parseRanges(job.ranges ?? "", n);
      const outputs: PdfOutput[] = [];
      for (const g of groups) {
        const out = await PDFDocument.create();
        const pages = await out.copyPages(src, g);
        pages.forEach((p) => out.addPage(p));
        const label = g.length === 1 ? `page-${g[0] + 1}` : `pages-${g[0] + 1}-${g[g.length - 1] + 1}`;
        outputs.push({ name: `${label}.pdf`, bytes: await out.save() });
      }
      return { outputs, pageCount: n };
    }
    case "rotate": {
      const doc = await load(job.file);
      const targets = job.pages?.length ? job.pages : doc.getPageIndices();
      for (const i of targets) {
        const page = doc.getPage(i);
        page.setRotation(degrees((page.getRotation().angle + job.angle) % 360));
      }
      return { outputs: [{ name: "rotated.pdf", bytes: await doc.save() }], pageCount: doc.getPageCount() };
    }
    case "images": {
      const doc = await PDFDocument.create();
      for (const img of job.images) {
        const { bytes, kind } = await toEmbeddable(img);
        const embedded = kind === "png" ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
        const iw = embedded.width,
          ih = embedded.height;
        let pw: number, ph: number;
        if (job.pageSize === "fit") {
          // Image at 96 dpi → points, plus margins.
          pw = iw * 0.75 + job.marginPt * 2;
          ph = ih * 0.75 + job.marginPt * 2;
        } else {
          const landscape = job.orientation === "landscape" || (job.orientation === "auto" && iw > ih);
          pw = landscape ? A4.h : A4.w;
          ph = landscape ? A4.w : A4.h;
        }
        const page = doc.addPage([pw, ph]);
        const boxW = pw - job.marginPt * 2,
          boxH = ph - job.marginPt * 2;
        const scale = Math.min(boxW / iw, boxH / ih, job.pageSize === "fit" ? 0.75 : Infinity);
        const dw = iw * scale,
          dh = ih * scale;
        page.drawImage(embedded, { x: (pw - dw) / 2, y: (ph - dh) / 2, width: dw, height: dh });
      }
      return { outputs: [{ name: "images.pdf", bytes: await doc.save() }], pageCount: doc.getPageCount() };
    }
  }
}

/** JPG/PNG embed directly; anything else (WebP, GIF, BMP) is re-encoded to JPEG. EXIF rotation is baked in. */
async function toEmbeddable(img: Blob): Promise<{ bytes: Uint8Array; kind: "jpg" | "png" }> {
  const bitmap = await createImageBitmap(img);
  try {
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext("2d")!;
    const isPng = img.type === "image/png";
    if (!isPng) {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(bitmap, 0, 0);
    const out = await canvas.convertToBlob(isPng ? { type: "image/png" } : { type: "image/jpeg", quality: 0.92 });
    return { bytes: new Uint8Array(await out.arrayBuffer()), kind: isPng ? "png" : "jpg" };
  } finally {
    bitmap.close();
  }
}
