// Renders a photo sheet as a 300 DPI JPG (for photo labs) and an exact-size PDF (for printers).
// Runs inside a Web Worker (OffscreenCanvas + pdf-lib), so nothing here may touch the DOM.
import { PDFDocument, rgb } from "pdf-lib";
import { setJpegDpi } from "./jpeg";
import { layoutSheet, mmToPt, mmToPx, SHEET_DPI } from "./sheet";

export type SheetJob = {
  /** One photo, already cropped to the photo size's aspect ratio (ideally exact 300 DPI pixels). JPEG. */
  photo: Blob;
  photoMm: { wMm: number; hMm: number };
  paper: { wMm: number; hMm: number; marginMm: number };
};

export type SheetResult = {
  jpg: Blob;
  pdf: Blob;
  count: number;
  widthPx: number;
  heightPx: number;
  landscape: boolean;
};

const CUT_GREY = 0.62; // light enough not to distract, dark enough to see on photo paper

export async function renderSheet(job: SheetJob): Promise<SheetResult> {
  const layout = layoutSheet(job.photoMm, job.paper);
  if (!layout.count) throw new Error("This photo size doesn't fit on the chosen paper.");

  // --- JPG -----------------------------------------------------------------------------------
  const widthPx = mmToPx(layout.pageWMm);
  const heightPx = mmToPx(layout.pageHMm);
  const pw = mmToPx(layout.photoWMm);
  const ph = mmToPx(layout.photoHMm);
  const canvas = new OffscreenCanvas(widthPx, heightPx);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, widthPx, heightPx);
  const bitmap = await createImageBitmap(job.photo, { imageOrientation: "from-image" });
  try {
    ctx.imageSmoothingQuality = "high";
    const g = Math.round(CUT_GREY * 255);
    ctx.strokeStyle = `rgb(${g},${g},${g})`;
    ctx.lineWidth = 2; // ≈0.17 mm at 300 DPI
    for (const c of layout.cells) {
      const x = mmToPx(c.xMm);
      const y = mmToPx(c.yMm);
      // Cut line sits just outside the photo so it never covers the picture.
      ctx.strokeRect(x - 1, y - 1, pw + 2, ph + 2);
      ctx.drawImage(bitmap, x, y, pw, ph);
    }
  } finally {
    bitmap.close();
  }
  const raw = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.95 });
  const jpgBytes = setJpegDpi(new Uint8Array(await raw.arrayBuffer()), SHEET_DPI);
  const jpg = new Blob([jpgBytes as BlobPart], { type: "image/jpeg" });

  // --- PDF: one embedded photo drawn N times at exact physical size, vector cut lines -----------
  const doc = await PDFDocument.create();
  doc.setTitle("Passport photo sheet");
  doc.setProducer("documently.in");
  doc.setCreator("documently.in");
  const pageW = mmToPt(layout.pageWMm);
  const pageH = mmToPt(layout.pageHMm);
  const page = doc.addPage([pageW, pageH]);
  const img = await doc.embedJpg(new Uint8Array(await job.photo.arrayBuffer()));
  const w = mmToPt(layout.photoWMm);
  const h = mmToPt(layout.photoHMm);
  const line = 0.5; // pt
  for (const c of layout.cells) {
    const x = mmToPt(c.xMm);
    const y = pageH - mmToPt(c.yMm) - h; // PDF origin is bottom-left
    page.drawRectangle({
      x: x - line / 2,
      y: y - line / 2,
      width: w + line,
      height: h + line,
      borderColor: rgb(CUT_GREY, CUT_GREY, CUT_GREY),
      borderWidth: line,
    });
    page.drawImage(img, { x, y, width: w, height: h });
  }
  const pdfBytes = await doc.save();
  const pdf = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });

  return { jpg, pdf, count: layout.count, widthPx, heightPx, landscape: layout.landscape };
}
