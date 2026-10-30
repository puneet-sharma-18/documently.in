"use client";

import { downloadBlob, formatBytes } from "@/lib/files";
import { makeZip } from "@/lib/tools/zip";

export type ResultFile = { name: string; blob: Blob };

type Props = {
  files: ResultFile[];
  /** Total size of the input, to show before → after. */
  beforeBytes?: number;
  /** Extra facts shown under the sizes, e.g. "413 × 531 px · 200 DPI". */
  details?: string[];
  warning?: string;
  zipName?: string;
  onDownload?: () => void;
  onReset: () => void;
  resetLabel?: string;
};

export default function ResultCard({ files, beforeBytes, details, warning, zipName = "documently.zip", onDownload, onReset, resetLabel = "Do another" }: Props) {
  const after = files.reduce((n, f) => n + f.blob.size, 0);
  const saved = beforeBytes && beforeBytes > after ? Math.min(99, Math.round((1 - after / beforeBytes) * 100)) : null;

  async function downloadAll() {
    const entries = await Promise.all(files.map(async (f) => ({ name: f.name, data: new Uint8Array(await f.blob.arrayBuffer()) })));
    downloadBlob(makeZip(entries), zipName);
    onDownload?.();
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-brand-200 bg-brand-50 p-4 sm:p-5" role="status" aria-live="polite">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="text-lg font-bold text-brand-900">Done ✓</p>
        <p className="text-sm text-[#2b3532]">
          {beforeBytes !== undefined && (
            <>
              <span className="line-through decoration-muted/60">{formatBytes(beforeBytes)}</span>
              {" → "}
            </>
          )}
          <strong>{formatBytes(after)}</strong>
          {saved !== null && saved > 0 && <span className="ml-2 rounded-full bg-brand-600 px-2 py-0.5 text-xs font-semibold text-white">−{saved}%</span>}
        </p>
      </div>
      {details && details.length > 0 && <p className="mt-1 text-sm text-muted">{details.join(" · ")}</p>}
      {warning && <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-warn">{warning}</p>}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {files.length === 1 ? (
          <button
            type="button"
            onClick={() => {
              downloadBlob(files[0].blob, files[0].name);
              onDownload?.();
            }}
            className="min-h-12 rounded-xl bg-brand-600 px-6 font-semibold text-white hover:bg-brand-700"
          >
            Download {files[0].name.split(".").pop()?.toUpperCase()}
          </button>
        ) : (
          <button type="button" onClick={downloadAll} className="min-h-12 rounded-xl bg-brand-600 px-6 font-semibold text-white hover:bg-brand-700">
            Download all ({files.length} files, ZIP)
          </button>
        )}
        <button type="button" onClick={onReset} className="min-h-12 rounded-xl border border-line bg-card px-6 font-semibold hover:border-brand-500">
          {resetLabel}
        </button>
      </div>

      {files.length > 1 && (
        <ul className="mt-4 max-h-56 divide-y divide-line overflow-auto rounded-lg border border-line bg-card text-sm">
          {files.map((f) => (
            <li key={f.name} className="flex items-center justify-between gap-3 px-3 py-2">
              <span className="truncate">{f.name}</span>
              <span className="flex shrink-0 items-center gap-3">
                <span className="text-muted">{formatBytes(f.blob.size)}</span>
                <button type="button" onClick={() => downloadBlob(f.blob, f.name)} className="min-h-10 rounded-md px-2 font-semibold text-brand-700 hover:bg-brand-50">
                  Save
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
