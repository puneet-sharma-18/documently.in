"use client";

import { useState } from "react";
import Dropzone from "../Dropzone";
import ResultCard from "../ResultCard";
import { Busy, Chips, ErrorBox, NumberField, Panel, PrimaryButton } from "./ui";
import { useJob } from "./useJob";
import type { ToolProps } from "./types";
import { isHeic, isImage, renameFile } from "@/lib/files";
import { runImageJob } from "@/lib/tools/run-image";

const TARGETS = [10, 20, 50, 100, 200, 500] as const;

export default function CompressImage({ tool, presetSlug, config }: ToolProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [target, setTarget] = useState<number | "custom">(config?.targetKB ?? 50);
  const [custom, setCustom] = useState<number | "">(config?.targetKB ?? 30);
  const job = useJob(tool, presetSlug);
  const options: (number | "custom")[] = [...new Set([...TARGETS, ...(config?.targetKB ? [config.targetKB] : [])])].sort((a, b) => a - b);
  options.push("custom");
  const targetKB = target === "custom" ? Number(custom) || 0 : target;

  function start() {
    if (!files.length || targetKB < 2) return;
    const list = files;
    job.run({ bytes: list.reduce((n, f) => n + f.size, 0), count: list.length }, async () => {
      const results = [];
      const warnings: string[] = [];
      for (const f of list) {
        const r = await runImageJob({ file: f, maxKB: targetKB, format: "jpeg", allowDownscale: true });
        results.push({ name: renameFile(f.name, `-${targetKB}kb`, "jpg"), blob: r.blob, w: r.width, h: r.height });
        if (r.missed && r.message) warnings.push(r.message);
      }
      return {
        files: results.map(({ name, blob }) => ({ name, blob })),
        beforeBytes: list.reduce((n, f) => n + f.size, 0),
        details: list.length === 1 ? [`${results[0].w} × ${results[0].h} px`, "JPG"] : [`${list.length} images`, "JPG"],
        warning: warnings[0],
      };
    });
  }

  return (
    <Panel>
      {!job.output && (
        <>
          <Dropzone
            accept="image/jpeg,image/png,image/webp,image/gif,image/bmp"
            multiple
            compact={files.length > 0}
            label={files.length ? "Add more photos" : "Choose photos"}
            hint={files.length ? undefined : "JPG, PNG or WebP. Batch up to 30 at once."}
            onFiles={(fs) => {
              if (fs.some(isHeic)) return job.setError("iPhone HEIC photos aren't supported yet. Set Camera → Formats → Most Compatible, or take a screenshot of the photo and use that.");
              const ok = fs.filter(isImage);
              if (!ok.length) return job.setError("Those aren't images. Pick JPG, PNG or WebP files.");
              job.setError(null);
              setFiles((prev) => [...prev, ...ok].slice(0, 30));
            }}
            onReject={job.setError}
          />
          {files.length > 0 && (
            <>
              <p className="text-sm text-muted">
                {files.length} photo{files.length > 1 ? "s" : ""} selected ·{" "}
                <button type="button" className="font-semibold text-brand-700 underline" onClick={() => setFiles([])}>
                  clear
                </button>
              </p>
              <Chips label="Make each photo under" options={options} value={target} onChange={setTarget} format={(v) => (v === "custom" ? "Custom" : `${v} KB`)} />
              {target === "custom" && <NumberField label="Maximum size" value={custom} onChange={setCustom} min={2} max={5000} suffix="KB" />}
              {job.busy ? <Busy message={job.progress} /> : <PrimaryButton onClick={start} disabled={targetKB < 2}>{`Compress to under ${targetKB} KB`}</PrimaryButton>}
            </>
          )}
        </>
      )}
      {job.error && <ErrorBox message={job.error} />}
      {job.output && (
        <ResultCard
          {...job.output}
          zipName={`photos-${targetKB}kb.zip`}
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
