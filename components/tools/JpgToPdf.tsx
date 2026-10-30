"use client";

import { useState } from "react";
import Dropzone from "../Dropzone";
import ResultCard from "../ResultCard";
import { Busy, Chips, ErrorBox, FileRow, Panel, PrimaryButton } from "./ui";
import { useJob } from "./useJob";
import type { ToolProps } from "./types";
import { isHeic, isImage } from "@/lib/files";
import { runPdfJob } from "@/lib/tools/run-pdf";

type PageSize = "a4" | "fit";
type Orientation = "auto" | "portrait" | "landscape";
type Margin = 0 | 18 | 36;

export default function JpgToPdf({ tool, presetSlug }: ToolProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>("a4");
  const [orientation, setOrientation] = useState<Orientation>("auto");
  const [margin, setMargin] = useState<Margin>(18);
  const job = useJob(tool, presetSlug);

  function move(i: number, dir: -1 | 1) {
    setFiles((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function start() {
    const list = files;
    job.run({ bytes: list.reduce((n, f) => n + f.size, 0), count: list.length }, async () => {
      const r = await runPdfJob({ op: "images", images: list, pageSize, orientation, marginPt: margin });
      const out = r.outputs[0];
      return {
        files: [{ name: list.length === 1 ? list[0].name.replace(/\.[^.]+$/, "") + ".pdf" : "images.pdf", blob: new Blob([out.bytes as BlobPart], { type: "application/pdf" }) }],
        beforeBytes: list.reduce((n, f) => n + f.size, 0),
        details: [`${r.pageCount} page${r.pageCount > 1 ? "s" : ""}`, pageSize === "a4" ? "A4" : "Page = image size"],
      };
    });
  }

  return (
    <Panel>
      {!job.output && (
        <>
          <Dropzone
            accept="image/jpeg,image/png,image/webp"
            multiple
            compact={files.length > 0}
            label={files.length ? "Add more images" : "Choose images"}
            hint={files.length ? undefined : "JPG, PNG or WebP — one page per image."}
            onFiles={(fs) => {
              if (fs.some(isHeic)) return job.setError("iPhone HEIC photos aren't supported yet. Set Camera → Formats → Most Compatible.");
              const ok = fs.filter(isImage);
              if (!ok.length) return job.setError("Those aren't images. Pick JPG, PNG or WebP files.");
              job.setError(null);
              setFiles((prev) => [...prev, ...ok].slice(0, 100));
            }}
            onReject={job.setError}
          />
          {files.length > 0 && (
            <>
              <ol className="space-y-2">
                {files.map((f, i) => (
                  <li key={`${f.name}-${i}`} className="flex items-center gap-2">
                    <span className="w-6 text-right text-sm text-muted">{i + 1}.</span>
                    <div className="min-w-0 flex-1">
                      <FileRow file={f} onRemove={() => setFiles((p) => p.filter((_, j) => j !== i))} />
                    </div>
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" className="min-h-10 min-w-10 rounded-md border border-line disabled:opacity-30">
                      ↑
                    </button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === files.length - 1} aria-label="Move down" className="min-h-10 min-w-10 rounded-md border border-line disabled:opacity-30">
                      ↓
                    </button>
                  </li>
                ))}
              </ol>
              <Chips label="Page size" options={["a4", "fit"] as PageSize[]} value={pageSize} onChange={setPageSize} format={(p) => (p === "a4" ? "A4" : "Same as image")} />
              {pageSize === "a4" && (
                <Chips label="Orientation" options={["auto", "portrait", "landscape"] as Orientation[]} value={orientation} onChange={setOrientation} format={(o) => o[0].toUpperCase() + o.slice(1)} />
              )}
              <Chips label="Margin" options={[0, 18, 36] as Margin[]} value={margin} onChange={setMargin} format={(m) => (m === 0 ? "None" : m === 18 ? "Small" : "Large")} />
              {job.busy ? <Busy message={job.progress} /> : <PrimaryButton onClick={start}>Create PDF ({files.length} page{files.length > 1 ? "s" : ""})</PrimaryButton>}
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
            setFiles([]);
          }}
        />
      )}
    </Panel>
  );
}
