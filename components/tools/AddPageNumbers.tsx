"use client";

import { useState } from "react";
import Dropzone from "../Dropzone";
import ResultCard from "../ResultCard";
import { Busy, Chips, ErrorBox, FileRow, NumberField, Panel, PrimaryButton } from "./ui";
import { useJob } from "./useJob";
import type { ToolProps } from "./types";
import { isPdf, renameFile } from "@/lib/files";
import { runPdfJob } from "@/lib/tools/run-pdf";
import type { NumberFormat, NumberPosition } from "@/lib/tools/pdf-core";

const POSITIONS: NumberPosition[] = ["bottom-center", "bottom-right", "bottom-left", "top-center", "top-right", "top-left"];
const POSITION_LABEL: Record<NumberPosition, string> = {
  "bottom-center": "Bottom centre",
  "bottom-right": "Bottom right",
  "bottom-left": "Bottom left",
  "top-center": "Top centre",
  "top-right": "Top right",
  "top-left": "Top left",
};
const FORMATS: NumberFormat[] = ["n", "page-n", "page-n-of-total"];
type Size = 10 | 12 | 16;

export default function AddPageNumbers({ tool, presetSlug }: ToolProps) {
  const [file, setFile] = useState<File | null>(null);
  const [position, setPosition] = useState<NumberPosition>("bottom-center");
  const [format, setFormat] = useState<NumberFormat>("n");
  const [firstNumber, setFirstNumber] = useState<number | "">(1);
  const [skipFirst, setSkipFirst] = useState(false);
  const [size, setSize] = useState<Size>(12);
  const job = useJob(tool, presetSlug);

  function start() {
    if (!file) return;
    const f = file;
    const first = firstNumber === "" || firstNumber < 0 ? 1 : Math.floor(firstNumber);
    job.run({ bytes: f.size, count: 1 }, async () => {
      const r = await runPdfJob({ op: "numbers", file: f, position, format, start: first, skipFirst, fontSize: size });
      const numbered = r.pageCount - (skipFirst ? 1 : 0);
      return {
        files: [{ name: renameFile(f.name, "-numbered", "pdf"), blob: new Blob([r.outputs[0].bytes as BlobPart], { type: "application/pdf" }) }],
        details: [`${numbered} page${numbered === 1 ? "" : "s"} numbered`, POSITION_LABEL[position]],
      };
    });
  }

  return (
    <Panel>
      {!file && !job.output && (
        <Dropzone
          accept="application/pdf,.pdf"
          label="Choose PDF"
          hint="Adds page numbers to every page. Processed on your device."
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
          <Chips label="Position" options={POSITIONS} value={position} onChange={setPosition} format={(p) => POSITION_LABEL[p]} />
          <Chips
            label="Format"
            options={FORMATS}
            value={format}
            onChange={setFormat}
            format={(f) => (f === "n" ? "1" : f === "page-n" ? "Page 1" : "Page 1 of N")}
          />
          <Chips label="Text size" options={[10, 12, 16] as Size[]} value={size} onChange={setSize} format={(s) => (s === 10 ? "Small" : s === 12 ? "Medium" : "Large")} />
          <NumberField label="Start numbering at" value={firstNumber} onChange={setFirstNumber} min={0} max={9999} />
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold">
            <input type="checkbox" checked={skipFirst} onChange={(e) => setSkipFirst(e.target.checked)} className="h-5 w-5 shrink-0 accent-brand-600" />
            Skip the first page (cover page stays unnumbered)
          </label>
          {job.busy ? <Busy message={job.progress} /> : <PrimaryButton onClick={start}>Add page numbers</PrimaryButton>}
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
