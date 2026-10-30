"use client";

import { useState } from "react";
import Dropzone from "../Dropzone";
import ResultCard from "../ResultCard";
import Cropper from "./Cropper";
import { useObjectUrl } from "./useObjectUrl";
import { Busy, Chips, ErrorBox, Panel, PrimaryButton } from "./ui";
import { useJob } from "./useJob";
import type { ToolProps } from "./types";
import { isHeic, isImage, renameFile } from "@/lib/files";
import type { CropRect } from "@/lib/tools/image-core";
import { runImageJob } from "@/lib/tools/run-image";

const RATIOS = { free: null, "1:1": 1, "3.5:4.5": 3.5 / 4.5, "4:3": 4 / 3, "3:1": 3, "16:9": 16 / 9 } as const;
type Ratio = keyof typeof RATIOS;

export default function CropImage({ tool, presetSlug }: ToolProps) {
  const [file, setFile] = useState<File | null>(null);
  const [ratio, setRatio] = useState<Ratio>("free");
  const [crop, setCrop] = useState<CropRect | null>(null);
  const job = useJob(tool, presetSlug);

  const url = useObjectUrl(file);

  function start() {
    if (!file || !crop) return;
    const f = file;
    const png = f.type === "image/png";
    job.run({ bytes: f.size, count: 1 }, async () => {
      const r = await runImageJob({ file: f, crop, format: png ? "png" : "jpeg", quality: 0.92 });
      return {
        files: [{ name: renameFile(f.name, "-cropped", png ? "png" : "jpg"), blob: r.blob }],
        beforeBytes: f.size,
        details: [`${r.width} × ${r.height} px`, png ? "PNG" : "JPG"],
      };
    });
  }

  return (
    <Panel>
      {!file && !job.output && (
        <Dropzone
          accept="image/jpeg,image/png,image/webp"
          label="Choose photo"
          hint="JPG, PNG or WebP. Processed on your device."
          onFiles={(fs) => {
            if (isHeic(fs[0])) return job.setError("iPhone HEIC photos aren't supported yet. Set Camera → Formats → Most Compatible, or screenshot the photo.");
            if (!isImage(fs[0])) return job.setError("That isn't an image. Pick a JPG, PNG or WebP.");
            job.setError(null);
            setFile(fs[0]);
          }}
          onReject={job.setError}
        />
      )}
      {file && url && !job.output && (
        <>
          <Chips label="Shape" options={Object.keys(RATIOS) as Ratio[]} value={ratio} onChange={setRatio} format={(r) => (r === "free" ? "Free" : r === "3.5:4.5" ? "Passport 3.5:4.5" : r === "3:1" ? "Signature 3:1" : r)} />
          <Cropper key={`${ratio}-${url}`} src={url} aspect={RATIOS[ratio]} onChange={setCrop} />
          {crop && <p className="text-center text-sm text-muted">{Math.round(crop.w)} × {Math.round(crop.h)} px</p>}
          <div className="flex flex-col gap-2 sm:flex-row">
            {job.busy ? <Busy message={job.progress} /> : <PrimaryButton onClick={start} disabled={!crop}>Crop photo</PrimaryButton>}
            <button type="button" onClick={() => setFile(null)} className="min-h-12 rounded-xl border border-line px-6 font-semibold hover:border-brand-500">
              Choose another
            </button>
          </div>
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
