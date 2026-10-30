// pdf-lib operations: merge, split, rotate, images → PDF, page numbers, watermark, organize. Runs inside a Web Worker.
import { PDFDocument, PDFFont, PDFPage, StandardFonts, degrees, rgb } from "pdf-lib";
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
    }
  | {
      op: "numbers";
      file: Blob;
      position: NumberPosition;
      format: NumberFormat;
      /** Number printed on the first numbered page. */
      start: number;
      /** Leave page 1 (e.g. a cover) unnumbered; numbering starts on page 2. */
      skipFirst: boolean;
      fontSize: number;
    }
  | {
      op: "watermark";
      file: Blob;
      text: string;
      /** 0.05–1 */
      opacity: number;
      layout: "diagonal" | "center" | "tiled";
      fontSize: number;
      color: "grey" | "red";
    }
  /** Output pages in this order (0-based source indices), each turned by an extra `rotate` degrees. Missing pages are dropped. */
  | { op: "organize"; file: Blob; pages: { index: number; rotate: 0 | 90 | 180 | 270 }[] };

export type NumberPosition = "bottom-center" | "bottom-right" | "bottom-left" | "top-center" | "top-right" | "top-left";
export type NumberFormat = "n" | "page-n" | "page-n-of-total";

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
    case "numbers": {
      const doc = await load(job.file);
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const pages = doc.getPages();
      const first = job.skipFirst ? 1 : 0;
      const total = job.start + (pages.length - first) - 1;
      const size = job.fontSize;
      for (let i = first; i < pages.length; i++) {
        const n = job.start + (i - first);
        const label = job.format === "n" ? String(n) : job.format === "page-n" ? `Page ${n}` : `Page ${n} of ${total}`;
        const page = pages[i];
        const { w, h } = visualSize(page);
        const tw = font.widthOfTextAtSize(label, size);
        // ~0.5 inch from the edge, scaled down on tiny pages (ID-card scans).
        const margin = Math.min(36, Math.min(w, h) * 0.06);
        const [vert, horiz] = job.position.split("-") as ["top" | "bottom", "left" | "center" | "right"];
        const vx = horiz === "left" ? margin : horiz === "right" ? w - margin - tw : (w - tw) / 2;
        const vy = vert === "bottom" ? margin : h - margin - font.heightAtSize(size, { descender: false });
        drawVisual(page, label, { vx, vy, angle: 0, font, size, color: rgb(0, 0, 0), opacity: 1 });
      }
      return { outputs: [{ name: "numbered.pdf", bytes: await doc.save() }], pageCount: pages.length };
    }
    case "watermark": {
      const text = job.text.trim();
      if (!text) throw new Error("Type the watermark text first.");
      const doc = await load(job.file);
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      try {
        font.encodeText(text);
      } catch {
        throw new Error("The watermark can only use English letters, numbers and common symbols.");
      }
      const color = job.color === "red" ? rgb(0.82, 0.1, 0.1) : rgb(0.45, 0.45, 0.45);
      const opacity = Math.min(1, Math.max(0.05, job.opacity));
      for (const page of doc.getPages()) {
        const { w, h } = visualSize(page);
        const cap = font.heightAtSize(1, { descender: false });
        if (job.layout === "tiled") {
          // A grid laid along the 30° text direction, rows offset like bricks, covering the whole page.
          const size = Math.min(job.fontSize, Math.min(w, h) / 6);
          const tw = font.widthOfTextAtSize(text, size);
          const a = (30 * Math.PI) / 180;
          const stepU = tw + size * 3;
          const stepV = size * 4;
          const reach = Math.hypot(w, h) / 2 + tw;
          for (let row = 0, v = -reach; v <= reach; v += stepV, row++) {
            for (let u = -reach + (row % 2) * (stepU / 2); u <= reach; u += stepU) {
              const cx = w / 2 + u * Math.cos(a) - v * Math.sin(a);
              const cy = h / 2 + u * Math.sin(a) + v * Math.cos(a);
              if (cx < -tw / 2 || cx > w + tw / 2 || cy < -size || cy > h + size) continue;
              drawCentred(page, text, { cx, cy, angle: 30, font, size, cap, color, opacity });
            }
          }
        } else {
          const angle = job.layout === "diagonal" ? (Math.atan2(h, w) * 180) / Math.PI : 0;
          // Shrink to fit the diagonal (or the width), so long text never runs off the page.
          const room = (job.layout === "diagonal" ? Math.hypot(w, h) : w) * 0.85;
          const size = Math.min(job.fontSize, room / font.widthOfTextAtSize(text, 1));
          drawCentred(page, text, { cx: w / 2, cy: h / 2, angle, font, size, cap, color, opacity });
        }
      }
      return { outputs: [{ name: "watermarked.pdf", bytes: await doc.save() }], pageCount: doc.getPageCount() };
    }
    case "organize": {
      if (!job.pages.length) throw new Error("Keep at least one page.");
      const src = await load(job.file);
      const out = await PDFDocument.create();
      const copied = await out.copyPages(
        src,
        job.pages.map((p) => p.index),
      );
      copied.forEach((page, i) => {
        const extra = job.pages[i].rotate;
        if (extra) page.setRotation(degrees((page.getRotation().angle + extra) % 360));
        out.addPage(page);
      });
      return { outputs: [{ name: "organized.pdf", bytes: await out.save() }], pageCount: out.getPageCount() };
    }
  }
}

// --- Drawing on pages as they appear on screen ---------------------------------------------
// A page with /Rotate is shown turned, so "bottom right" and "left-to-right" must be mapped back
// into the page's own coordinates. (vx, vy) are measured from the bottom-left of the visible page.

function pageRotation(page: PDFPage) {
  return (((page.getRotation().angle % 360) + 360) % 360) as 0 | 90 | 180 | 270;
}

function visualSize(page: PDFPage) {
  const box = page.getCropBox();
  const r = pageRotation(page);
  return r === 90 || r === 270 ? { w: box.height, h: box.width } : { w: box.width, h: box.height };
}

function toUser(page: PDFPage, vx: number, vy: number) {
  const box = page.getCropBox();
  const r = pageRotation(page);
  const [x, y] = r === 90 ? [box.width - vy, vx] : r === 180 ? [box.width - vx, box.height - vy] : r === 270 ? [vy, box.height - vx] : [vx, vy];
  return { x: box.x + x, y: box.y + y };
}

type Ink = { font: PDFFont; size: number; color: ReturnType<typeof rgb>; opacity: number };

/** Draw text whose baseline starts at visual (vx, vy), running at `angle`° anticlockwise as seen on screen. */
function drawVisual(page: PDFPage, text: string, o: Ink & { vx: number; vy: number; angle: number }) {
  const { x, y } = toUser(page, o.vx, o.vy);
  page.drawText(text, { x, y, font: o.font, size: o.size, color: o.color, opacity: o.opacity, rotate: degrees((o.angle + pageRotation(page)) % 360) });
}

/** Draw text centred on visual (cx, cy). `cap` is the font's cap height at size 1. */
function drawCentred(page: PDFPage, text: string, o: Ink & { cx: number; cy: number; angle: number; cap: number }) {
  const a = (o.angle * Math.PI) / 180;
  const half = o.font.widthOfTextAtSize(text, o.size) / 2;
  const up = (o.cap * o.size) / 2;
  const vx = o.cx - half * Math.cos(a) + up * Math.sin(a);
  const vy = o.cy - half * Math.sin(a) - up * Math.cos(a);
  drawVisual(page, text, { ...o, vx, vy });
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
