"use client";

import { useState } from "react";
import Dropzone from "../Dropzone";
import ResultCard from "../ResultCard";
import { Busy, Chips, ErrorBox, Panel, PrimaryButton } from "./ui";
import { useJob } from "./useJob";
import type { ToolProps } from "./types";
import { friendlyError, isImage, renameFile, UserFacingError } from "@/lib/files";
import { FORMAT_EXT, type ConvertFormat } from "@/lib/tools/convert";
import { decodableSource } from "@/lib/tools/heic";
import { runConvertJob } from "@/lib/tools/run-convert";

const FORMATS = ["jpeg", "png", "webp"] as const satisfies readonly ConvertFormat[];
const MAX_FILES = 30;
const acceptable = (f: File) => isImage(f) || /\.(avif|tiff?)$/i.test(f.name);

export default function ConvertImage({ tool, presetSlug }: ToolProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [format, setFormat] = useState<ConvertFormat>("jpeg");
  const job = useJob(tool, presetSlug);
  const ext = FORMAT_EXT[format];

  function start() {
    if (!files.length) return;
    const list = files;
    const fmt = format;
    const total = list.reduce((n, f) => n + f.size, 0);
    job.run({ bytes: total, count: list.length }, async (onProgress) => {
      const out: { name: string; blob: Blob; w: number; h: number }[] = [];
      const failed: string[] = [];
      const used = new Set<string>();
      for (const [i, f] of list.entries()) {
        const step = list.length > 1 ? ` ${i + 1} of ${list.length}` : "";
        onProgress(`Converting${step}…`);
        try {
          const source = await decodableSource(f, (m) => onProgress(list.length > 1 ? `${m} (${i + 1} of ${list.length})` : m));
          const r = await runConvertJob(
            { source, format: fmt, quality: 0.92 },
            { transfer: source instanceof ImageBitmap ? [source] : [] },
          );
          out.push({ name: uniqueName(renameFile(f.name, "", FORMAT_EXT[fmt]), used), blob: r.blob, w: r.width, h: r.height });
        } catch (err) {
          // One bad file shouldn't sink a batch; a single file reports its own error.
          if (list.length === 1) throw err;
          failed.push(`${f.name}: ${friendlyError(err)}`);
        }
      }
      if (!out.length) throw new UserFacingError(failed[0] ?? "None of these images could be converted.");
      return {
        files: out.map(({ name, blob }) => ({ name, blob })),
        beforeBytes: total,
        details: out.length === 1 ? [`${out[0].w} × ${out[0].h} px`, ext.toUpperCase()] : [`${out.length} images`, ext.toUpperCase()],
        warning: failed.length ? `Skipped ${failed.length} file${failed.length > 1 ? "s" : ""}. ${failed[0]}` : undefined,
      };
    });
  }

  return (
    <Panel>
      {!job.output && (
        <>
          <Dropzone
            accept="image/*,.heic,.heif"
            multiple
            compact={files.length > 0}
            label={files.length ? "Add more photos" : "Choose photos"}
            hint={files.length ? undefined : `HEIC, WebP, PNG, JPG and more. Up to ${MAX_FILES} at once.`}
            onFiles={(fs) => {
              const ok = fs.filter(acceptable);
              if (!ok.length) return job.setError("Those aren't images. Pick HEIC, JPG, PNG or WebP files.");
              job.setError(null);
              setFiles((prev) => [...prev, ...ok].slice(0, MAX_FILES));
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
              <Chips label="Convert to" options={FORMATS} value={format} onChange={setFormat} format={(f) => FORMAT_EXT[f].toUpperCase()} />
              {format === "jpeg" && <p className="text-sm text-muted">Transparent areas turn white. JPG is what most exam and government portals accept.</p>}
              {job.busy ? <Busy message={job.progress} /> : <PrimaryButton onClick={start}>{`Convert to ${ext.toUpperCase()}`}</PrimaryButton>}
            </>
          )}
        </>
      )}
      {job.error && <ErrorBox message={job.error} />}
      {job.output && (
        <ResultCard
          {...job.output}
          zipName={`photos-${ext}.zip`}
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

/** "IMG_1.jpg" twice → "IMG_1.jpg", "IMG_1-2.jpg" (zip entries and list keys must be unique). */
function uniqueName(name: string, used: Set<string>) {
  let candidate = name;
  for (let n = 2; used.has(candidate.toLowerCase()); n++) candidate = name.replace(/(\.[^.]+)$/, `-${n}$1`);
  used.add(candidate.toLowerCase());
  return candidate;
}
