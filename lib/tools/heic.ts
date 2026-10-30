// Main-thread image decoding with an iPhone HEIC/HEIF fallback.
// Chrome, Edge and Firefox can't decode HEIC; Safari can. We try the browser first and only then
// pull in the libheif decoder (heic-to, ~3 MB, LGPL-3.0), which is a separate chunk loaded on demand.
import { isHeic as heicByName, UserFacingError } from "@/lib/files";

/** HEIC/HEIF by MIME type, extension, or the ISO-BMFF `ftyp` brand (covers renamed or untyped files). */
export async function looksLikeHeic(file: Blob): Promise<boolean> {
  if (file instanceof File && heicByName(file)) return true;
  if (/heic|heif/i.test(file.type)) return true;
  if (file.size < 12) return false;
  const head = new Uint8Array(await file.slice(4, 12).arrayBuffer());
  const box = String.fromCharCode(...head.subarray(0, 4));
  const brand = String.fromCharCode(...head.subarray(4, 8));
  return box === "ftyp" && ["heic", "heix", "hevc", "hevx", "heim", "heis", "mif1", "msf1"].includes(brand);
}

/**
 * What to hand an image worker: the file itself when the worker can decode it, or an upright
 * ImageBitmap for HEIC files the browser can't read. EXIF/irot orientation is applied either way.
 */
export async function decodableSource(file: File, onProgress?: (m: string) => void): Promise<Blob | ImageBitmap> {
  if (!(await looksLikeHeic(file))) return file;
  try {
    // Safari decodes HEIC natively; hand the worker a bitmap so it doesn't have to.
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // fall through to libheif
  }
  onProgress?.("Loading iPhone photo decoder…");
  try {
    const { heicTo } = await import("heic-to");
    onProgress?.("Reading iPhone photo…");
    return await heicTo({ blob: file, type: "bitmap" });
  } catch (err) {
    console.error("HEIC decode failed", err);
    throw new UserFacingError(`We couldn't read "${file.name}". The file may be damaged or an unusual HEIC variant. On iPhone, share it from Photos as JPG (or take a screenshot) and try again.`);
  }
}
