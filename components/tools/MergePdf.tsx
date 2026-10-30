"use client";

import { useState } from "react";
import Dropzone from "../Dropzone";
import ResultCard from "../ResultCard";
import { Busy, ErrorBox, FileRow, Panel, PrimaryButton } from "./ui";
import { useJob } from "./useJob";
import type { ToolProps } from "./types";
import { isPdf } from "@/lib/files";
import { runPdfJob } from "@/lib/tools/run-pdf";

export default function MergePdf({ tool, presetSlug }: ToolProps) {
  const [files, setFiles] = useState<File[]>([]);
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
      const r = await runPdfJob({ op: "merge", files: list });
      return {
        files: [{ name: "merged.pdf", blob: new Blob([r.outputs[0].bytes as BlobPart], { type: "application/pdf" }) }],
        beforeBytes: list.reduce((n, f) => n + f.size, 0),
        details: [`${list.length} files → 1 PDF`, `${r.pageCount} pages`],
      };
    });
  }

  return (
    <Panel>
      {!job.output && (
        <>
          <Dropzone
            accept="application/pdf,.pdf"
            multiple
            compact={files.length > 0}
            label={files.length ? "Add more PDFs" : "Choose PDFs"}
            hint={files.length ? undefined : "Pick two or more. You can reorder them next."}
            onFiles={(fs) => {
              const ok = fs.filter(isPdf);
              if (!ok.length) return job.setError("Those aren't PDFs. Pick .pdf files.");
              job.setError(null);
              setFiles((prev) => [...prev, ...ok].slice(0, 50));
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
              {job.busy ? (
                <Busy message={job.progress} />
              ) : (
                <PrimaryButton onClick={start} disabled={files.length < 2}>
                  {files.length < 2 ? "Add at least 2 PDFs" : `Merge ${files.length} PDFs`}
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
            setFiles([]);
          }}
        />
      )}
    </Panel>
  );
}
