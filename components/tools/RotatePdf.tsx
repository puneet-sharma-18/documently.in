"use client";

import { useState } from "react";
import Dropzone from "../Dropzone";
import ResultCard from "../ResultCard";
import { Busy, Chips, ErrorBox, FileRow, Panel, PrimaryButton } from "./ui";
import { useJob } from "./useJob";
import type { ToolProps } from "./types";
import { isPdf, renameFile } from "@/lib/files";
import { runPdfJob } from "@/lib/tools/run-pdf";
import { parseRanges } from "@/lib/tools/ranges";

type Angle = 90 | 180 | 270;
type Which = "all" | "some";

export default function RotatePdf({ tool, presetSlug }: ToolProps) {
  const [file, setFile] = useState<File | null>(null);
  const [angle, setAngle] = useState<Angle>(90);
  const [which, setWhich] = useState<Which>("all");
  const [pageInput, setPageInput] = useState("1");
  const job = useJob(tool, presetSlug);

  function start() {
    if (!file) return;
    const f = file;
    job.run({ bytes: f.size, count: 1 }, async () => {
      let pages: number[] | undefined;
      if (which === "some") {
        const info = await runPdfJob({ op: "info", file: f });
        pages = parseRanges(pageInput, info.pageCount).flat();
      }
      const r = await runPdfJob({ op: "rotate", file: f, angle, pages });
      return {
        files: [{ name: renameFile(f.name, "-rotated", "pdf"), blob: new Blob([r.outputs[0].bytes as BlobPart], { type: "application/pdf" }) }],
        details: [`${pages ? pages.length : r.pageCount} page${(pages?.length ?? r.pageCount) > 1 ? "s" : ""} rotated ${angle}°`],
      };
    });
  }

  return (
    <Panel>
      {!file && !job.output && (
        <Dropzone
          accept="application/pdf,.pdf"
          label="Choose PDF"
          hint="Fix sideways or upside-down scans. Processed on your device."
          onFiles={(fs) => {
            if (!isPdf(fs[0])) return job.setError("That isn't a PDF. Pick a .pdf file.");
            job.setError(null);
            setFile(fs[0]);
          }}
          onReject={job.setError}
        />
      )}
      {file && !job.output && (
        <>
          <FileRow file={file} onRemove={() => setFile(null)} />
          <Chips label="Rotate" options={[90, 180, 270] as Angle[]} value={angle} onChange={setAngle} format={(a) => (a === 90 ? "90° right ↻" : a === 180 ? "180°" : "90° left ↺")} />
          <Chips label="Pages" options={["all", "some"] as Which[]} value={which} onChange={setWhich} format={(w) => (w === "all" ? "All pages" : "Only some pages")} />
          {which === "some" && (
            <label className="block text-sm font-semibold">
              Which pages
              <input value={pageInput} onChange={(e) => setPageInput(e.target.value)} placeholder="e.g. 2, 4-6" className="mt-1 min-h-12 w-full rounded-xl border border-line px-3 text-base font-normal" />
            </label>
          )}
          {job.busy ? <Busy message={job.progress} /> : <PrimaryButton onClick={start}>Rotate PDF</PrimaryButton>}
        </>
      )}
      {job.error && <ErrorBox message={job.error} />}
      {job.output && (
        <ResultCard
          {...job.output}
          onDownload={job.onDownload}
          onReset={() => {
            job.reset();
            setFile(null);
          }}
        />
      )}
    </Panel>
  );
}
