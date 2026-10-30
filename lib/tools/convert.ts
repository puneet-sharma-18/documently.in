// Format conversion (anything decodable → JPG / PNG / WebP). Runs inside a Web Worker
// (OffscreenCanvas), so nothing here may touch the DOM.
import { canvasToPng } from "./png";

export type ConvertFormat = "jpeg" | "png" | "webp";

export type ConvertJob = {
  /** A file the browser can decode, or an already-decoded bitmap (HEIC on browsers without HEIC support). */
  source: Blob | ImageBitmap;
  format: ConvertFormat;
  /** 0–1, for JPG and WebP. */
  quality?: number;
};

export type ConvertResult = { blob: Blob; width: number; height: number };

export const FORMAT_EXT: Record<ConvertFormat, string> = { jpeg: "jpg", png: "png", webp: "webp" };

export async function convertImage(job: ConvertJob): Promise<ConvertResult> {
  // "from-image" applies EXIF orientation, so sideways phone photos come out upright.
  const bitmap = job.source instanceof ImageBitmap ? job.source : await createImageBitmap(job.source, { imageOrientation: "from-image" });
  try {
    const { width, height } = bitmap;
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d")!;
    if (job.format === "jpeg") {
      // JPG has no transparency: flatten onto white rather than the encoder's default black.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
    }
    ctx.drawImage(bitmap, 0, 0);
    const type = `image/${job.format}`;
    const blob = job.format === "png" ? canvasToPng(canvas) : await canvas.convertToBlob({ type, quality: job.quality ?? 0.92 });
    // Browsers that can't encode a format silently fall back to PNG (Safari does this for WebP).
    if (blob.type !== type) throw new Error(`This browser can't save ${FORMAT_EXT[job.format].toUpperCase()} files. Choose JPG or PNG, or use Chrome.`);
    return { blob, width, height };
  } finally {
    bitmap.close();
  }
}
