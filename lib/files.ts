export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** "report.pdf" + "-compressed" + "pdf" → "report-compressed.pdf" */
export function renameFile(name: string, suffix: string, ext: string) {
  const base = name.replace(/\.[^.]+$/, "") || "file";
  return `${base}${suffix}.${ext}`;
}

export const isPdf = (f: File) => f.type === "application/pdf" || /\.pdf$/i.test(f.name);
export const isImage = (f: File) => f.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i.test(f.name);
export const isHeic = (f: File) => /heic|heif/i.test(f.type) || /\.(heic|heif)$/i.test(f.name);

/** Turn any thrown value into a short, human message. */
export function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/encrypt|password/i.test(msg))
    return "This PDF is password-protected. Remove the password first (open it, then 'Print → Save as PDF'), and try again.";
  if (/invalid pdf|no pdf header|failed to parse|unexpected eof/i.test(msg))
    return "This file doesn't look like a valid PDF. It may be damaged — try re-downloading or re-saving it.";
  if (/decode|source image|InvalidStateError|could not be decoded/i.test(msg))
    return "We couldn't read this image. Try a JPG or PNG — on iPhone, set Camera → Formats → Most Compatible, or take a screenshot of the photo.";
  if (/memory|allocation|RangeError/i.test(msg))
    return "This file is too large for your device's browser memory. Try a smaller file or use a laptop.";
  return msg || "Something went wrong. Please try again.";
}
