"use client";

import { useState } from "react";
import Dropzone from "../Dropzone";
import ResultCard from "../ResultCard";
import { Busy, Chips, ErrorBox, FileRow, Panel, PrimaryButton } from "./ui";
import { useJob } from "./useJob";
import type { ToolProps } from "./types";
import { formatBytes, isEncryptedPdf, isPdf, renameFile } from "@/lib/files";
import { runGsJob } from "@/lib/tools/run-gs";

const TARGETS = [50, 100, 200, 500, 1000] as const;
type Mode = "target" | "level";
type Level = "high" | "balanced" | "small";
const LEVEL_LABEL: Record<Level, string> = { high: "Best quality", balanced: "Balanced", small: "Smallest size" };

export default function CompressPdf({ tool, presetSlug, config }: ToolProps) {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<Mode>(config?.targetKB ? "target" : "target");
  const [target, setTarget] = useState<number>(config?.targetKB ?? 200);
  const [level, setLevel] = useState<Level>("balanced");
  const [gray, setGray] = useState(false);
  const job = useJob(tool, presetSlug);

  const targets = (TARGETS as readonly number[]).includes(target) ? (TARGETS as readonly number[]) : [...TARGETS, target].sort((a, b) => a - b);

  function start() {
    if (!file) return;
    const f = file;
    job.run({ bytes: f.size, count: 1 }, async (onProgress) => {
      const head = new TextDecoder().decode(await f.slice(0, 1024).arrayBuffer());
      if (!head.includes("%PDF-")) throw new Error("Invalid PDF: no PDF header");
      if (mode === "target" && f.size <= target * 1000 - 1024) {
        return {
          files: [{ name: f.name, blob: f }],
          beforeBytes: f.size,
          details: [`Already under ${kbLabel(target)} — no compression needed`],
        };
      }
      const bytes = await f.arrayBuffer();
      // Ghostscript silently drops pages of encrypted files, so refuse them up front.
      if (isEncryptedPdf(new Uint8Array(bytes))) throw new Error("This PDF is password-protected.");
      const res = await runGsJob(
        { bytes, mode, level, targetKB: target, gray },
        { transfer: [bytes], onProgress },
      );
      let blob = new Blob([res.bytes], { type: "application/pdf" });
      let warning: string | undefined;
      if (blob.size >= f.size) {
        blob = f;
        warning = "This PDF is already well optimised — we couldn't make it smaller, so here's your original file.";
      } else if (mode === "target" && !res.reachedTarget) {
        warning = `The smallest we could reach is ${formatBytes(blob.size)}. Try "Black & white", or split the PDF and upload only the pages the form needs.`;
      }
      return {
        files: [{ name: renameFile(f.name, "-compressed", "pdf"), blob }],
        beforeBytes: f.size,
        details: [`Images at ${res.resolution} DPI`, gray ? "Black & white" : "Colour kept"],
        warning,
      };
    });
  }

  return (
    <Panel>
      {!file && !job.output && (
        <Dropzone
          accept="application/pdf,.pdf"
          label="Choose PDF"
          hint="Up to 200 MB. Processed on your device."
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
          <Chips label="Compression" options={["target", "level"] as Mode[]} value={mode} onChange={setMode} format={(m) => (m === "target" ? "Target size" : "Quality level")} />
          {mode === "target" ? (
            <Chips label="Make it under" options={targets} value={target} onChange={setTarget} format={kbLabel} />
          ) : (
            <Chips label="Level" options={["high", "balanced", "small"] as Level[]} value={level} onChange={setLevel} format={(l) => LEVEL_LABEL[l]} />
          )}
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input type="checkbox" checked={gray} onChange={(e) => setGray(e.target.checked)} className="h-5 w-5 accent-brand-600" />
            Black & white (much smaller for scanned documents)
          </label>
          {job.busy ? <Busy message={job.progress} /> : <PrimaryButton onClick={start}>{mode === "target" ? `Compress to under ${kbLabel(target)}` : "Compress PDF"}</PrimaryButton>}
          {!job.busy && <p className="text-xs text-muted">First use downloads the compression engine once (about 11 MB); after that it loads from your browser cache.</p>}
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

function kbLabel(kb: number) {
  return kb >= 1000 ? `${kb / 1000} MB` : `${kb} KB`;
}
