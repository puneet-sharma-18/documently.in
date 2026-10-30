// Image pipeline used by every photo tool. Runs inside a Web Worker (OffscreenCanvas),
// so nothing here may touch the DOM.
import { padJpeg, setJpegDpi } from "./jpeg";
import { canvasToPng } from "./png";

export type CropRect = { x: number; y: number; w: number; h: number };

export type ImageJob = {
  file: Blob;
  crop?: CropRect;
  /** Exact output size. If only one side is given, the other follows the aspect ratio. */
  width?: number;
  height?: number;
  /** Shrink (never enlarge) so the longest side is at most this. */
  maxSide?: number;
  format?: "jpeg" | "png";
  /** JPEG quality 0–1 when no size target is set. */
  quality?: number;
  minKB?: number;
  maxKB?: number;
  dpi?: number;
  /** Let the pipeline shrink dimensions if quality alone can't reach maxKB. */
  allowDownscale?: boolean;
};

export type ImageResult = {
  blob: Blob;
  width: number;
  height: number;
  quality: number | null;
  /** True when the exact KB range could not be met; `message` explains. */
  missed: boolean;
  message?: string;
};

const KB = 1024;

export async function processImage(job: ImageJob): Promise<ImageResult> {
  const bitmap = await createImageBitmap(job.file);
  try {
    const src = job.crop ?? { x: 0, y: 0, w: bitmap.width, h: bitmap.height };
    let { w: outW, h: outH } = targetDims(src, job);
    const format = job.format ?? "jpeg";
    // Portals disagree on whether 1 KB is 1000 or 1024 bytes, so aim inside both readings.
    const maxBytes = job.maxKB ? job.maxKB * 1000 - 512 : undefined;
    const minBytes = job.minKB ? job.minKB * KB : undefined;
    const dimsLocked = Boolean(job.width || job.height);

    let canvas = draw(bitmap, src, outW, outH, format);

    if (format === "png") {
      const blob = canvasToPng(canvas);
      return { blob, width: outW, height: outH, quality: null, missed: false };
    }

    if (!maxBytes) {
      const q = job.quality ?? 0.85;
      let blob = await canvas.convertToBlob({ type: "image/jpeg", quality: q });
      blob = await finalizeJpeg(blob, minBytes, job.dpi);
      return { blob, width: outW, height: outH, quality: q, missed: false };
    }

    // Find the highest quality that fits under maxBytes; shrink dimensions if even low quality is too big.
    // 0.35 when we may shrink: measured at 20/50/100 KB on a 12 MP photo, raising it to 0.5 (fewer pixels,
    // higher quality) scored slightly *lower* SSIM at the same file size, so keep the larger image.
    const floorQ = dimsLocked || job.allowDownscale === false ? 0.05 : 0.35;
    for (let attempt = 0; attempt < 8; attempt++) {
      const best = await bestQualityUnder(canvas, maxBytes, floorQ);
      if (best) {
        const blob = await finalizeJpeg(best.blob, minBytes, job.dpi);
        return { blob, width: outW, height: outH, quality: best.q, missed: false };
      }
      if (dimsLocked || job.allowDownscale === false) break;
      const smallest = await canvas.convertToBlob({ type: "image/jpeg", quality: floorQ });
      const scale = Math.max(0.3, Math.sqrt(maxBytes / smallest.size) * 0.92);
      outW = Math.max(16, Math.round(outW * scale));
      outH = Math.max(16, Math.round(outH * scale));
      canvas = draw(bitmap, src, outW, outH, format);
    }

    // Could not get under the limit: return the smallest we can make and say so.
    const smallest = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.05 });
    const blob = await finalizeJpeg(smallest, undefined, job.dpi);
    return {
      blob,
      width: outW,
      height: outH,
      quality: 0.05,
      missed: true,
      message: `At ${outW}×${outH}px this image can't go below ${Math.ceil(blob.size / KB)} KB. Crop tighter or choose a smaller pixel size.`,
    };
  } finally {
    bitmap.close();
  }
}

function targetDims(src: CropRect, job: ImageJob) {
  if (job.width && job.height) return { w: job.width, h: job.height };
  if (job.width) return { w: job.width, h: Math.max(1, Math.round((src.h / src.w) * job.width)) };
  if (job.height) return { w: Math.max(1, Math.round((src.w / src.h) * job.height)), h: job.height };
  if (job.maxSide && Math.max(src.w, src.h) > job.maxSide) {
    const s = job.maxSide / Math.max(src.w, src.h);
    return { w: Math.round(src.w * s), h: Math.round(src.h * s) };
  }
  return { w: Math.round(src.w), h: Math.round(src.h) };
}

/** Draws src→out. When the aspect ratios differ, centre-crops the source (cover) instead of stretching. */
function draw(bitmap: ImageBitmap, src: CropRect, outW: number, outH: number, format: "jpeg" | "png") {
  let { x, y, w, h } = src;
  const srcAspect = w / h;
  const outAspect = outW / outH;
  if (Math.abs(srcAspect - outAspect) > 0.01) {
    if (srcAspect > outAspect) {
      const nw = h * outAspect;
      x += (w - nw) / 2;
      w = nw;
    } else {
      const nh = w / outAspect;
      y += (h - nh) / 2;
      h = nh;
    }
  }

  // A plain crop (no resize) must be a pixel copy. The crop box comes from screen coordinates and is
  // fractional, which makes drawImage resample every pixel: softer output and a bigger PNG.
  if (Math.abs(w - outW) < 1 && Math.abs(h - outH) < 1) {
    x = Math.min(Math.max(0, Math.round(x)), bitmap.width - outW);
    y = Math.min(Math.max(0, Math.round(y)), bitmap.height - outH);
    w = outW;
    h = outH;
  }

  // Step down in halves for big reductions — single-pass downscaling looks jagged.
  let source: CanvasImageSource = bitmap;
  let sx = x,
    sy = y,
    sw = w,
    sh = h;
  while (sw / 2 > outW && sh / 2 > outH) {
    const step = new OffscreenCanvas(Math.round(sw / 2), Math.round(sh / 2));
    const sctx = step.getContext("2d")!;
    sctx.imageSmoothingQuality = "high";
    sctx.drawImage(source, sx, sy, sw, sh, 0, 0, step.width, step.height);
    source = step;
    sx = 0;
    sy = 0;
    sw = step.width;
    sh = step.height;
  }

  const canvas = new OffscreenCanvas(outW, outH);
  const ctx = canvas.getContext("2d")!;
  if (format === "jpeg") {
    // JPEG has no transparency: flatten onto white, which is what forms expect.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, outW, outH);
  }
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, outW, outH);
  return canvas;
}

async function bestQualityUnder(canvas: OffscreenCanvas, maxBytes: number, floorQ: number) {
  let lo = floorQ,
    hi = 0.95;
  let best: { blob: Blob; q: number } | null = null;
  const top = await canvas.convertToBlob({ type: "image/jpeg", quality: hi });
  if (top.size <= maxBytes) return { blob: top, q: hi };
  for (let i = 0; i < 8; i++) {
    const mid = (lo + hi) / 2;
    const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: mid });
    if (blob.size <= maxBytes) {
      best = { blob, q: mid };
      lo = mid;
    } else {
      hi = mid;
    }
  }
  if (!best) {
    const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: floorQ });
    if (blob.size <= maxBytes) best = { blob, q: floorQ };
  }
  return best;
}

async function finalizeJpeg(blob: Blob, minBytes: number | undefined, dpi: number | undefined) {
  let bytes: Uint8Array = new Uint8Array(await blob.arrayBuffer());
  if (dpi) bytes = setJpegDpi(bytes, dpi);
  if (minBytes && bytes.length < minBytes) bytes = padJpeg(bytes, minBytes + 256);
  return new Blob([bytes as BlobPart], { type: "image/jpeg" });
}
