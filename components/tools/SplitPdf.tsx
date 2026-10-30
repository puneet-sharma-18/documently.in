"use client";

import { useState } from "react";
import Dropzone from "../Dropzone";
import ResultCard from "../ResultCard";
import { Busy, Chips, ErrorBox, FileRow, Panel, PrimaryButton } from "./ui";
import { useJob } from "./useJob";
import type { ToolProps } from "./types";
import { isPdf } from "@/lib/files";
import { runPdfJob } from "@/lib/tools/run-pdf";

type Mode = "ranges" | "every";

export default function SplitPdf({ tool, presetSlug }: ToolProps) {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>("ranges");
  const [ranges, setRanges] = useState("1-2");
  const job = useJob(tool, presetSlug);

  async function pick(f: File) {
    job.setError(null);
    setFile(f);
    try {
      const r = await runPdfJob({ op: "info", file: f });
      setPages(r.pageCount);
      setRanges(r.pageCount > 1 ? `1-${Math.min(2, r.pageCount)}` : "1");
    } catch (err) {
      setFile(null);
      job.setError((await import("@/lib/files")).friendlyError(err));
    }
  }

  function start() {
    if (!file) return;
    const f = file;
    job.run({ bytes: f.size, count: 1 }, async () => {
      const r = await runPdfJob({ op: "split", file: f, mode, ranges });
      const base = f.name.replace(/\.pdf$/i, "");
      return {
        files: r.outputs.map((o) => ({ name: `${base}-${o.name}`, blob: new Blob([o.bytes as BlobPart], { type: "application/pdf" }) })),
        details: [`${r.outputs.length} PDF${r.outputs.length > 1 ? "s" : ""} from ${r.pageCount} pages`],
      };
    });
  }

  return (
    <Panel>
      {!file && !job.output && (
        <Dropzone
          accept="application/pdf,.pdf"
          label="Choose PDF"
          hint="Pull out the pages you need. Processed on your device."
          onFiles={(fs) => (isPdf(fs[0]) ? pick(fs[0]) : job.setError("That isn't a PDF. Pick a .pdf file."))}
          onReject={job.setError}
        />
      )}
      {file && !job.output && (
        <>
          <FileRow file={file} onRemove={() => setFile(null)} />
          {pages !== null && <p className="text-sm text-muted">This PDF has {pages} page{pages > 1 ? "s" : ""}.</p>}
          <Chips label="How to split" options={["ranges", "every"] as Mode[]} value={mode} onChange={setMode} format={(m) => (m === "ranges" ? "Pick pages" : "Every page separately")} />
          {mode === "ranges" && (
            <label className="block text-sm font-semibold">
              Pages to extract
              <input
                value={ranges}
                onChange={(e) => setRanges(e.target.value)}
                placeholder="e.g. 1-3, 5, 8-end"
                className="mt-1 min-h-12 w-full rounded-xl border border-line px-3 text-base font-normal"
              />
              <span className="mt-1 block font-normal text-muted">Each comma-separated part becomes its own PDF. &quot;1-3, 5&quot; gives two files.</span>
            </label>
          )}
          {job.busy ? <Busy message={job.progress} /> : <PrimaryButton onClick={start} disabled={pages === null}>Split PDF</PrimaryButton>}
        </>
      )}
      {job.error && <ErrorBox message={job.error} />}
      {job.output && (
        <ResultCard
          {...job.output}
          zipName={`${file?.name.replace(/\.pdf$/i, "") || "split"}-pages.zip`}
          onDownload={job.onDownload}
          onReset={() => {
            job.reset();
            setFile(null);
            setPages(null);
          }}
        />
      )}
    </Panel>
  );
}
