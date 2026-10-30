// pdf-lib operations: merge, split, rotate, images → PDF. Runs inside a Web Worker.
import { PDFDocument, degrees } from "pdf-lib";
import { jpegOrientation, jpegSize } from "./jpeg";
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
        // On A4 there's no visible gain past ~250 DPI, so cap pixels to keep the PDF upload-friendly.
        const { bytes, kind } = await toEmbeddable(img, job.pageSize === "a4" ? 2400 : 4000);
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

/**
 * Upright JPEGs that already fit are embedded byte-for-byte (no generation loss). Everything else is
 * re-encoded (PNG stays PNG, the rest become JPEG) so EXIF rotation is baked in and size is capped.
 */
async function toEmbeddable(img: Blob, maxSide: number): Promise<{ bytes: Uint8Array; kind: "jpg" | "png" }> {
  if (img.type === "image/jpeg" || /\.jpe?g$/i.test((img as File).name ?? "")) {
    const raw = new Uint8Array(await img.arrayBuffer());
    const size = jpegSize(raw);
    if (size && Math.max(size.width, size.height) <= maxSide && jpegOrientation(raw) === 1) return { bytes: raw, kind: "jpg" };
  }
  const bitmap = await createImageBitmap(img);
  try {
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = new OffscreenCanvas(Math.round(bitmap.width * scale), Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d")!;
    const isPng = img.type === "image/png";
    if (!isPng) {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const out = await canvas.convertToBlob(isPng ? { type: "image/png" } : { type: "image/jpeg", quality: 0.85 });
    return { bytes: new Uint8Array(await out.arrayBuffer()), kind: isPng ? "png" : "jpg" };
  } finally {
    bitmap.close();
  }
}
