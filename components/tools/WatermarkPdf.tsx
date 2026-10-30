"use client";

import { useState } from "react";
import Dropzone from "../Dropzone";
import ResultCard from "../ResultCard";
import { Busy, Chips, ErrorBox, FileRow, Panel, PrimaryButton } from "./ui";
import { useJob } from "./useJob";
import type { ToolProps } from "./types";
import { isPdf, renameFile } from "@/lib/files";
import { runPdfJob } from "@/lib/tools/run-pdf";

type Layout = "diagonal" | "center" | "tiled";
type Strength = 0.2 | 0.35 | 0.55;
type Size = 36 | 54 | 72;
type Colour = "grey" | "red";

const SUGGESTIONS = ["For KYC only", "Only for bank account opening", "Not valid for any other purpose", "COPY"];
// The built-in PDF font covers English letters, digits, common symbols and Latin accents only.
const SUPPORTED = /^[\x20-\x7E -ÿ]*$/;

export default function WatermarkPdf({ tool, presetSlug }: ToolProps) {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("For KYC only");
  const [layout, setLayout] = useState<Layout>("diagonal");
  const [strength, setStrength] = useState<Strength>(0.35);
  const [size, setSize] = useState<Size>(54);
  const [colour, setColour] = useState<Colour>("grey");
  const job = useJob(tool, presetSlug);

  const clean = text.trim();
  const badText = !SUPPORTED.test(clean);

  function start() {
    if (!file) return;
    if (!clean) return job.setError("Type the watermark text first.");
    if (badText) return job.setError("Watermark text can use English letters, numbers and common symbols only.");
    const f = file;
    job.run({ bytes: f.size, count: 1 }, async () => {
      const r = await runPdfJob({ op: "watermark", file: f, text: clean, opacity: strength, layout, fontSize: size, color: colour });
      return {
        files: [{ name: renameFile(f.name, "-watermarked", "pdf"), blob: new Blob([r.outputs[0].bytes as BlobPart], { type: "application/pdf" }) }],
        details: [`${r.pageCount} page${r.pageCount === 1 ? "" : "s"} marked`, `“${clean}”`],
      };
    });
  }

  return (
    <Panel>
      {!file && !job.output && (
        <Dropzone
          accept="application/pdf,.pdf"
          label="Choose PDF"
          hint="Stamp text like “For KYC only” across every page. Processed on your device."
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
          <label className="block text-sm font-semibold">
            Watermark text
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={80}
              placeholder="e.g. For KYC with XYZ Bank only"
              className="mt-1 min-h-12 w-full rounded-xl border border-line px-3 text-base font-normal"
            />
          </label>
          {badText && <p className="text-xs text-danger">Use English letters, numbers and common symbols. Hindi and other scripts aren&apos;t supported yet.</p>}
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setText(s)}
                className="min-h-10 rounded-full border border-dashed border-line bg-paper px-3 text-sm text-muted hover:border-ink hover:text-ink"
              >
                {s}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted">Tip: name who the copy is for and why, e.g. “For HDFC home loan KYC only”, so it can&apos;t be reused elsewhere.</p>
          <Chips label="Layout" options={["diagonal", "center", "tiled"] as Layout[]} value={layout} onChange={setLayout} format={(l) => (l === "diagonal" ? "Diagonal" : l === "center" ? "Centre" : "Repeat all over")} />
          <Chips label="Strength" options={[0.2, 0.35, 0.55] as Strength[]} value={strength} onChange={setStrength} format={(s) => (s === 0.2 ? "Light" : s === 0.35 ? "Medium" : "Strong")} />
          <Chips label="Text size" options={[36, 54, 72] as Size[]} value={size} onChange={setSize} format={(s) => (s === 36 ? "Small" : s === 54 ? "Medium" : "Large")} />
          <Chips label="Colour" options={["grey", "red"] as Colour[]} value={colour} onChange={setColour} format={(c) => (c === "grey" ? "Grey" : "Red")} />
          {job.busy ? (
            <Busy message={job.progress} />
          ) : (
            <PrimaryButton onClick={start} disabled={!clean || badText}>
              Add watermark
            </PrimaryButton>
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
            setFile(null);
          }}
        />
      )}
    </Panel>
  );
}
