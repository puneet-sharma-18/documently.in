"use client";

import { useEffect, useRef, useState } from "react";
import Dropzone from "../Dropzone";
import ResultCard from "../ResultCard";
import { Busy, ErrorBox, FileRow, Panel, PrimaryButton } from "./ui";
import { useJob } from "./useJob";
import type { ToolProps } from "./types";
import { friendlyError, isPdf, renameFile } from "@/lib/files";
import { runPdfJob } from "@/lib/tools/run-pdf";
import { renderPdfThumbnails } from "@/lib/tools/pdf-render";

type Turn = 0 | 90 | 180 | 270;
/** One page card. `index` is the 0-based page in the original file. */
type Item = { index: number; rotate: Turn; removed: boolean };

const btn =
  "flex min-h-11 items-center justify-center rounded-lg border border-line bg-card text-base font-semibold hover:border-ink disabled:cursor-not-allowed disabled:opacity-35";

export default function OrganizePdf({ tool, presetSlug }: ToolProps) {
  const [file, setFile] = useState<File | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [thumbs, setThumbs] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const job = useJob(tool, presetSlug);
  // Each pick gets a token so a slow render of an earlier file can't write into the current one.
  const token = useRef(0);
  const urls = useRef<string[]>([]);

  function clearThumbs() {
    urls.current.forEach((u) => URL.revokeObjectURL(u));
    urls.current = [];
    setThumbs({});
  }

  useEffect(
    () => () => {
      token.current++;
      urls.current.forEach((u) => URL.revokeObjectURL(u));
    },
    [],
  );

  async function pick(f: File) {
    const mine = ++token.current;
    clearThumbs();
    setItems([]);
    setFile(f);
    setLoading("Reading pages…");
    try {
      await renderPdfThumbnails(
        f,
        {
          maxSide: 360,
          isCancelled: () => token.current !== mine,
          onCount: (n) => setItems(Array.from({ length: n }, (_, i) => ({ index: i, rotate: 0, removed: false }))),
        },
        (page, blob) => {
          if (token.current !== mine) return;
          const url = URL.createObjectURL(blob);
          urls.current.push(url);
          setThumbs((t) => ({ ...t, [page - 1]: url }));
        },
      );
    } catch (err) {
      if (token.current === mine) {
        job.setError(friendlyError(err));
        setFile(null);
        setItems([]);
      }
    } finally {
      if (token.current === mine) setLoading(null);
    }
  }

  function reset() {
    token.current++;
    clearThumbs();
    setItems([]);
    setFile(null);
    setLoading(null);
  }

  function move(pos: number, by: -1 | 1) {
    setItems((list) => {
      const to = pos + by;
      if (to < 0 || to >= list.length) return list;
      const next = list.slice();
      [next[pos], next[to]] = [next[to], next[pos]];
      return next;
    });
  }

  function update(pos: number, change: Partial<Item>) {
    setItems((list) => list.map((it, i) => (i === pos ? { ...it, ...change } : it)));
  }

  const kept = items.filter((it) => !it.removed);
  const changed = items.some((it, i) => it.index !== i || it.rotate || it.removed);

  function save() {
    if (!file || !kept.length) return;
    const f = file;
    const pages = kept.map((it) => ({ index: it.index, rotate: it.rotate }));
    const removed = items.length - kept.length;
    job.run({ bytes: f.size, count: 1 }, async () => {
      const r = await runPdfJob({ op: "organize", file: f, pages });
      return {
        files: [{ name: renameFile(f.name, "-organized", "pdf"), blob: new Blob([r.outputs[0].bytes as BlobPart], { type: "application/pdf" }) }],
        details: [`${r.pageCount} page${r.pageCount === 1 ? "" : "s"}`, ...(removed ? [`${removed} removed`] : [])],
      };
    });
  }

  return (
    <Panel>
      {!file && !job.output && (
        <Dropzone
          accept="application/pdf,.pdf"
          label="Choose PDF"
          hint="Reorder, rotate or remove pages. Processed on your device."
          onFiles={(fs) => {
            if (!isPdf(fs[0])) return job.setError("That isn't a PDF. Pick a .pdf file.");
            job.setError(null);
            void pick(fs[0]);
          }}
          onReject={job.setError}
        />
      )}

      {file && !job.output && (
        <>
          <FileRow file={file} onRemove={reset} />
          {loading && !items.length && <Busy message={loading} />}
          {items.length > 0 && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <p className="text-muted">
                  {kept.length} of {items.length} page{items.length === 1 ? "" : "s"} kept
                  {loading && Object.keys(thumbs).length < items.length && " · loading previews…"}
                </p>
                {changed && (
                  <button
                    type="button"
                    onClick={() => setItems((list) => list.map((it): Item => ({ ...it, rotate: 0, removed: false })).sort((a, b) => a.index - b.index))}
                    className="min-h-11 rounded-full px-3 font-semibold text-muted underline-offset-4 hover:text-ink hover:underline"
                  >
                    Undo all changes
                  </button>
                )}
              </div>
              <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {items.map((it, pos) => {
                  const sideways = it.rotate === 90 || it.rotate === 270;
                  const label = `page ${it.index + 1}`;
                  return (
                    <li key={it.index} className={`rounded-xl border p-2 ${it.removed ? "border-dashed border-line bg-paper" : "border-line bg-card"}`}>
                      <div className="mb-2 flex items-baseline justify-between gap-1 px-1 text-sm">
                        <span className="font-bold">{it.removed ? "Removed" : kept.indexOf(it) + 1}</span>
                        <span className="text-xs text-muted">Original p. {it.index + 1}</span>
                      </div>
                      <div className={`relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-lg bg-paper ${it.removed ? "opacity-30 grayscale" : ""}`}>
                        {thumbs[it.index] ? (
                          // eslint-disable-next-line @next/next/no-img-element -- local blob preview
                          <img
                            src={thumbs[it.index]}
                            alt={`Preview of ${label}`}
                            style={{ transform: `rotate(${it.rotate}deg)` }}
                            className={`shadow-sm transition-transform duration-200 ${sideways ? "max-h-[75%] max-w-[133%]" : "max-h-full max-w-full"}`}
                          />
                        ) : (
                          <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" aria-hidden />
                        )}
                      </div>
                      {it.removed ? (
                        <button type="button" onClick={() => update(pos, { removed: false })} className={`${btn} mt-2 w-full`}>
                          Restore
                        </button>
                      ) : (
                        <div className="mt-2 grid grid-cols-2 gap-1.5">
                          <button type="button" onClick={() => move(pos, -1)} disabled={pos === 0} aria-label={`Move ${label} earlier`} className={btn}>
                            ←
                          </button>
                          <button type="button" onClick={() => move(pos, 1)} disabled={pos === items.length - 1} aria-label={`Move ${label} later`} className={btn}>
                            →
                          </button>
                          <button
                            type="button"
                            onClick={() => update(pos, { rotate: ((it.rotate + 90) % 360) as Turn })}
                            aria-label={`Rotate ${label} right`}
                            className={btn}
                          >
                            ↻
                          </button>
                          <button type="button" onClick={() => update(pos, { removed: true })} aria-label={`Remove ${label}`} className={`${btn} hover:border-danger hover:text-danger`}>
                            ✕
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
              {!kept.length && <p className="text-sm text-danger">Every page is removed. Restore at least one page to save.</p>}
              {job.busy ? (
                <Busy message={job.progress} />
              ) : (
                <PrimaryButton onClick={save} disabled={!kept.length}>
                  Save PDF ({kept.length} page{kept.length === 1 ? "" : "s"})
                </PrimaryButton>
              )}
            </>
          )}
        </>
      )}

      {job.error && <ErrorBox message={job.error} />}
      {job.output && (
        <ResultCard
          {...job.output}
          onDownload={job.onDownload}
          onReset={() => {
            job.reset();
            reset();
          }}
        />
      )}
    </Panel>
  );
}
