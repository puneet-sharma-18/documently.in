"use client";

import { useState } from "react";
import Dropzone from "../Dropzone";
import ResultCard from "../ResultCard";
import Cropper from "./Cropper";
import { useObjectUrl } from "./useObjectUrl";
import { Busy, Chips, ErrorBox, Panel, PrimaryButton } from "./ui";
import { useJob } from "./useJob";
import type { ToolProps } from "./types";
import type { ExamItem } from "@/lib/data";
import type { CropRect } from "@/lib/tools/image-core";
import { isHeic, isImage } from "@/lib/files";
import { runImageJob } from "@/lib/tools/run-image";

/** Generic items for the main tool page, when no exam is chosen. */
const GENERIC: ExamItem[] = [
  {
    key: "photo",
    label: "Passport photo (3.5 × 4.5 cm)",
    widthPx: null,
    heightPx: null,
    widthCm: 3.5,
    heightCm: 4.5,
    minKB: 20,
    maxKB: 50,
    format: "jpg",
    dpi: 200,
    rules: [],
    outWidth: 276,
    outHeight: 354,
    outputNote: "3.5 × 4.5 cm at 200 DPI = 276 × 354 px. Change the KB range below if your form asks for something else.",
  },
  {
    key: "signature",
    label: "Signature (3:1 strip)",
    widthPx: null,
    heightPx: null,
    widthCm: null,
    heightCm: null,
    minKB: 10,
    maxKB: 20,
    format: "jpg",
    dpi: 200,
    rules: [],
    outWidth: 300,
    outHeight: 100,
  },
];

export default function ExamPhotoSignature({ tool, presetSlug, config }: ToolProps) {
  const items = config?.items?.length ? config.items : GENERIC;
  const [key, setKey] = useState(items[0].key);
  const item = items.find((i) => i.key === key) ?? items[0];
  const [minKB, setMinKB] = useState<number | null>(item.minKB);
  const [maxKB, setMaxKB] = useState<number | null>(item.maxKB);
  const [file, setFile] = useState<File | null>(null);
  const url = useObjectUrl(file);
  const [crop, setCrop] = useState<CropRect | null>(null);
  const job = useJob(tool, presetSlug ? `${presetSlug}:${item.key}` : item.key);

  function pickItem(k: string) {
    const next = items.find((i) => i.key === k) ?? items[0];
    setKey(next.key);
    setMinKB(next.minKB);
    setMaxKB(next.maxKB);
    job.reset();
  }

  function start() {
    if (!file || !crop) return;
    const f = file;
    job.run({ bytes: f.size, count: 1 }, async () => {
      const r = await runImageJob({
        file: f,
        crop,
        width: item.outWidth,
        height: item.outHeight,
        format: "jpeg",
        minKB: minKB ?? undefined,
        maxKB: maxKB ?? undefined,
        dpi: item.dpi ?? 200,
      });
      const kb = r.blob.size / 1024;
      const inRange = (minKB === null || r.blob.size >= minKB * 1024) && (maxKB === null || r.blob.size <= maxKB * 1000);
      return {
        files: [{ name: `${presetSlug ?? "exam"}-${item.key}.jpg`, blob: r.blob }],
        beforeBytes: f.size,
        details: [
          `${r.width} × ${r.height} px`,
          `${item.dpi ?? 200} DPI`,
          inRange ? `✓ ${kb.toFixed(1)} KB — inside ${rangeLabel(minKB, maxKB)}` : `${kb.toFixed(1)} KB`,
        ],
        warning: r.message,
      };
    });
  }

  const aspect = item.outWidth / item.outHeight;

  return (
    <Panel>
      {items.length > 1 && (
        <Chips label="What are you uploading?" options={items.map((i) => i.key)} value={key} onChange={pickItem} format={(k) => items.find((i) => i.key === k)?.label ?? k} />
      )}

      <div className="rounded-xl bg-paper p-3 text-sm">
        <p className="font-semibold">
          Output: {item.outWidth} × {item.outHeight} px · JPG · {rangeLabel(minKB, maxKB)}
        </p>
        {item.outputNote && <p className="mt-1 text-muted">{item.outputNote}</p>}
      </div>

      {!config?.items?.length && (
        <div className="grid grid-cols-2 gap-3 text-sm">
          <KbInput label="Min KB" value={minKB} onChange={setMinKB} />
          <KbInput label="Max KB" value={maxKB} onChange={setMaxKB} />
        </div>
      )}

      {!file && !job.output && (
        <Dropzone
          accept="image/jpeg,image/png,image/webp"
          label={`Choose ${item.key === "signature" ? "signature" : item.key === "photo" ? "photo" : "image"}`}
          hint="Use a clear, well-lit scan or phone photo. Processed on your device."
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
          <p className="text-sm text-muted">Drag the box to frame the {item.key === "signature" ? "signature with a little white margin" : item.key === "photo" ? "face — head and top of shoulders" : "image"}. The shape is locked to the required size.</p>
          <Cropper key={`${item.key}-${url}`} src={url} aspect={aspect} onChange={setCrop} />
          <div className="flex flex-col gap-2 sm:flex-row">
            {job.busy ? <Busy message={job.progress} /> : <PrimaryButton onClick={start} disabled={!crop}>Make {item.outWidth} × {item.outHeight} px JPG</PrimaryButton>}
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
          resetLabel={items.length > 1 ? "Do the next upload" : "Do another"}
          onReset={() => {
            job.reset();
            setFile(null);
            if (items.length > 1) pickItem(items[(items.findIndex((x) => x.key === key) + 1) % items.length].key);
          }}
        />
      )}
    </Panel>
  );
}

function rangeLabel(min: number | null, max: number | null) {
  if (min && max) return `${min}–${max} KB`;
  if (max) return `under ${max} KB`;
  if (min) return `over ${min} KB`;
  return "any size";
}

function KbInput({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number | null) => void }) {
  return (
    <label className="block font-semibold">
      {label}
      <input
        type="number"
        inputMode="numeric"
        min={1}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        className="mt-1 min-h-12 w-full rounded-xl border border-line px-3 font-normal"
      />
    </label>
  );
}

