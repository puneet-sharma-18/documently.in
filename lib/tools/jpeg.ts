// Byte-level JPEG helpers: set the DPI stored in the JFIF header, and pad a file up to a
// minimum size (many exam portals reject images *below* a minimum KB).

const SOI = [0xff, 0xd8];

function isJfifApp0(b: Uint8Array) {
  return b[2] === 0xff && b[3] === 0xe0 && b[6] === 0x4a && b[7] === 0x46 && b[8] === 0x49 && b[9] === 0x46 && b[10] === 0;
}

/** Writes `dpi` into the JFIF density fields, inserting a JFIF APP0 segment if the encoder omitted it. */
export function setJpegDpi(bytes: Uint8Array, dpi: number): Uint8Array {
  if (bytes[0] !== SOI[0] || bytes[1] !== SOI[1]) return bytes;
  const d = Math.max(1, Math.min(65535, Math.round(dpi)));
  if (isJfifApp0(bytes)) {
    const out = bytes.slice();
    out[13] = 1; // units: dots per inch
    out[14] = d >> 8;
    out[15] = d & 0xff;
    out[16] = d >> 8;
    out[17] = d & 0xff;
    return out;
  }
  const app0 = new Uint8Array([
    0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, d >> 8, d & 0xff, d >> 8, d & 0xff, 0x00, 0x00,
  ]);
  const out = new Uint8Array(bytes.length + app0.length);
  out.set(SOI, 0);
  out.set(app0, 2);
  out.set(bytes.subarray(2), 2 + app0.length);
  return out;
}

/**
 * Reads the EXIF orientation (1–8) from a JPEG; 1 when absent or unreadable.
 * Anything other than 1 means the pixels must be redrawn to appear upright in a PDF.
 */
export function jpegOrientation(bytes: Uint8Array): number {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return 1;
  let p = 2;
  while (p + 4 < bytes.length && bytes[p] === 0xff) {
    const marker = bytes[p + 1];
    const len = (bytes[p + 2] << 8) | bytes[p + 3];
    if (marker === 0xda) break; // start of scan: no more metadata
    // APP1 "Exif\0\0"
    if (marker === 0xe1 && bytes[p + 4] === 0x45 && bytes[p + 5] === 0x78 && bytes[p + 6] === 0x69 && bytes[p + 7] === 0x66) {
      const t = p + 10; // TIFF header
      const le = bytes[t] === 0x49;
      const u16 = (o: number) => (le ? bytes[o] | (bytes[o + 1] << 8) : (bytes[o] << 8) | bytes[o + 1]);
      const u32 = (o: number) => (le ? u16(o) | (u16(o + 2) << 16) : (u16(o) << 16) | u16(o + 2));
      const ifd = t + u32(t + 4);
      const count = u16(ifd);
      for (let i = 0; i < count; i++) {
        const e = ifd + 2 + i * 12;
        if (e + 10 > bytes.length) break;
        if (u16(e) === 0x0112) return u16(e + 8) || 1;
      }
      return 1;
    }
    p += 2 + len;
  }
  return 1;
}

/** Image width/height from the JPEG frame header (SOF0–SOF15 except DHT/JPG/DAC), or null. */
export function jpegSize(bytes: Uint8Array): { width: number; height: number } | null {
  let p = 2;
  while (p + 9 < bytes.length && bytes[p] === 0xff) {
    const marker = bytes[p + 1];
    const len = (bytes[p + 2] << 8) | bytes[p + 3];
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: (bytes[p + 5] << 8) | bytes[p + 6], width: (bytes[p + 7] << 8) | bytes[p + 8] };
    }
    if (marker === 0xda) break;
    p += 2 + len;
  }
  return null;
}

/**
 * Grows a JPEG to at least `minBytes` by inserting COM (comment) segments right after SOI.
 * Decoders skip comments, so the picture is pixel-identical.
 */
export function padJpeg(bytes: Uint8Array, minBytes: number): Uint8Array {
  let missing = minBytes - bytes.length;
  if (missing <= 0) return bytes;
  const segments: Uint8Array[] = [];
  while (missing > 0) {
    // Each segment costs 4 bytes of header; payload max 65533.
    const payload = Math.max(1, Math.min(65533, missing - 4));
    const seg = new Uint8Array(payload + 4);
    seg[0] = 0xff;
    seg[1] = 0xfe;
    seg[2] = (payload + 2) >> 8;
    seg[3] = (payload + 2) & 0xff;
    seg.fill(0x20, 4);
    segments.push(seg);
    missing -= seg.length;
  }
  const extra = segments.reduce((n, s) => n + s.length, 0);
  // Insert after the JFIF APP0 if present so the JFIF header stays the first segment.
  const insertAt = isJfifApp0(bytes) ? 2 + 2 + ((bytes[4] << 8) | bytes[5]) : 2;
  const out = new Uint8Array(bytes.length + extra);
  out.set(bytes.subarray(0, insertAt), 0);
  let off = insertAt;
  for (const s of segments) {
    out.set(s, off);
    off += s.length;
  }
  out.set(bytes.subarray(insertAt), off);
  return out;
}
