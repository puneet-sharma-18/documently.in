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
