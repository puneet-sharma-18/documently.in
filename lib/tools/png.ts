// Lossless PNG encoder. Browsers' canvas.convertToBlob("image/png") always writes RGBA with light
// compression, so a cropped screenshot can come out bigger than the original. This writes the
// smallest exact colour type (palette ≤256 colours, else RGB when fully opaque, else RGBA),
// picks a filter per row and deflates at a high level. Pixels are bit-for-bit identical.
import { zlibSync } from "fflate";

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes: Uint8Array, start: number, end: number) {
  let c = 0xffffffff;
  for (let i = start; i < end; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array) {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  view.setUint32(8 + data.length, crc32(out, 4, 8 + data.length));
  return out;
}

/** Exact palette if the image has at most 256 distinct RGBA colours, else null. */
function buildPalette(px: Uint8ClampedArray) {
  const index = new Map<number, number>();
  const n = px.length / 4;
  const indices = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const key = ((px[i * 4] << 24) | (px[i * 4 + 1] << 16) | (px[i * 4 + 2] << 8) | px[i * 4 + 3]) >>> 0;
    let idx = index.get(key);
    if (idx === undefined) {
      if (index.size === 256) return null;
      idx = index.size;
      index.set(key, idx);
    }
    indices[i] = idx;
  }
  return { colors: [...index.keys()], indices };
}

function paeth(a: number, b: number, c: number) {
  const p = a + b - c;
  const pa = Math.abs(p - a),
    pb = Math.abs(p - b),
    pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

/** Applies the PNG filter that minimises the sum of absolute residuals for each row (the libpng heuristic). */
function filterRows(raw: Uint8Array, width: number, height: number, bpp: number, adaptive: boolean) {
  const stride = width * bpp;
  const out = new Uint8Array(height * (stride + 1));
  const candidate = new Uint8Array(stride);
  for (let y = 0; y < height; y++) {
    const row = y * stride;
    const prev = y > 0 ? row - stride : -1;
    const dst = y * (stride + 1);
    if (!adaptive) {
      out[dst] = 0;
      out.set(raw.subarray(row, row + stride), dst + 1);
      continue;
    }
    let bestSum = Infinity;
    for (let f = 0; f < 5; f++) {
      let sum = 0;
      for (let x = 0; x < stride; x++) {
        const cur = raw[row + x];
        const a = x >= bpp ? raw[row + x - bpp] : 0;
        const b = prev >= 0 ? raw[prev + x] : 0;
        const c = prev >= 0 && x >= bpp ? raw[prev + x - bpp] : 0;
        const v = (f === 0 ? cur : f === 1 ? cur - a : f === 2 ? cur - b : f === 3 ? cur - ((a + b) >> 1) : cur - paeth(a, b, c)) & 0xff;
        candidate[x] = v;
        sum += v < 128 ? v : 256 - v;
        if (sum >= bestSum) break;
      }
      if (sum < bestSum) {
        bestSum = sum;
        out[dst] = f;
        out.set(candidate, dst + 1);
      }
    }
  }
  return out;
}

export function encodePng(img: ImageData): Uint8Array {
  const { width, height, data: px } = img;
  const n = width * height;
  const palette = buildPalette(px);

  let colorType: number, bpp: number, raw: Uint8Array;
  const extra: Uint8Array[] = [];
  if (palette) {
    colorType = 3;
    bpp = 1;
    raw = palette.indices;
    const plte = new Uint8Array(palette.colors.length * 3);
    const trns = new Uint8Array(palette.colors.length);
    palette.colors.forEach((c, i) => {
      plte[i * 3] = c >>> 24;
      plte[i * 3 + 1] = (c >>> 16) & 0xff;
      plte[i * 3 + 2] = (c >>> 8) & 0xff;
      trns[i] = c & 0xff;
    });
    extra.push(chunk("PLTE", plte));
    if (palette.colors.some((c) => (c & 0xff) !== 255)) extra.push(chunk("tRNS", trns));
  } else {
    let opaque = true;
    for (let i = 3; i < px.length; i += 4)
      if (px[i] !== 255) {
        opaque = false;
        break;
      }
    colorType = opaque ? 2 : 6;
    bpp = opaque ? 3 : 4;
    if (opaque) {
      raw = new Uint8Array(n * 3);
      for (let i = 0, j = 0; i < px.length; i += 4, j += 3) {
        raw[j] = px[i];
        raw[j + 1] = px[i + 1];
        raw[j + 2] = px[i + 2];
      }
    } else {
      raw = new Uint8Array(px.buffer, px.byteOffset, px.byteLength);
    }
  }

  // Palette images compress best unfiltered; truecolour gets per-row adaptive filters.
  const filtered = filterRows(raw, width, height, bpp, colorType !== 3);
  // Level 9 is noticeably slower on very large images for ~1% gain, so drop to 6 above ~24 MB raw.
  const idat = zlibSync(filtered, { level: filtered.length > 24e6 ? 6 : 9 });

  const ihdr = new Uint8Array(13);
  const hv = new DataView(ihdr.buffer);
  hv.setUint32(0, width);
  hv.setUint32(4, height);
  ihdr[8] = 8;
  ihdr[9] = colorType;
  const parts = [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), ...extra, chunk("IDAT", idat), chunk("IEND", new Uint8Array(0))];
  const out = new Uint8Array(parts.reduce((s, p) => s + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

/** Encodes a canvas losslessly with {@link encodePng}. */
export function canvasToPng(canvas: OffscreenCanvas): Blob {
  const ctx = canvas.getContext("2d")!;
  const bytes = encodePng(ctx.getImageData(0, 0, canvas.width, canvas.height));
  return new Blob([bytes as BlobPart], { type: "image/png" });
}
