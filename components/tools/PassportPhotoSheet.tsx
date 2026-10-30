"use client";

import { useEffect, useMemo, useState } from "react";
import Dropzone from "../Dropzone";
import ResultCard from "../ResultCard";
import Cropper from "./Cropper";
import { useObjectUrl } from "./useObjectUrl";
import { Busy, Chips, ErrorBox, Panel, PrimaryButton } from "./ui";
import { useJob } from "./useJob";
import type { ToolProps } from "./types";
import { friendlyError, isImage, renameFile } from "@/lib/files";
import { decodableSource, looksLikeHeic } from "@/lib/tools/heic";
import type { CropRect } from "@/lib/tools/image-core";
import { runConvertJob } from "@/lib/tools/run-convert";
import { runImageJob } from "@/lib/tools/run-image";
import { runSheetJob } from "@/lib/tools/run-sheet";
import { layoutSheet, mmToPx, PAPERS, PHOTO_SIZES, SHEET_DPI, type PaperKey, type PhotoSizeKey } from "@/lib/tools/sheet";

const SIZE_KEYS = Object.keys(PHOTO_SIZES) as PhotoSizeKey[];
const PAPER_KEYS = Object.keys(PAPERS) as PaperKey[];
const sizeChip = (k: PhotoSizeKey) => (k === "35x45" ? "35 × 45 mm (passport)" : PHOTO_SIZES[k].label);

export default function PassportPhotoSheet({ tool, presetSlug }: ToolProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preparing, setPreparing] = useState<string | null>(null);
  const [size, setSize] = useState<PhotoSizeKey>("35x45");
  const [paper, setPaper] = useState<PaperKey>("4x6");
  const [crop, setCrop] = useState<CropRect | null>(null);
  const job = useJob(tool, presetSlug);
  const url = useObjectUrl(file);

  const photo = PHOTO_SIZES[size];
  const sheet = PAPERS[paper];
  const count = layoutSheet(photo, sheet).count;

  async function pick(f: File) {
    if (!isImage(f)) return job.setError("That isn't an image. Pick a JPG, PNG, WebP or HEIC photo.");
    job.setError(null);
    if (!(await looksLikeHeic(f))) return setFile(f);
    // The cropper previews with <img>, which can't show HEIC outside Safari: turn it into a JPG first.
    setPreparing("Reading iPhone photo…");
    try {
      const source = await decodableSource(f, setPreparing);
      const r = await runConvertJob({ source, format: "jpeg", quality: 0.95 }, { transfer: source instanceof ImageBitmap ? [source] : [] });
      setFile(new File([r.blob], renameFile(f.name, "", "jpg"), { type: "image/jpeg" }));
    } catch (err) {
      job.setError(friendlyError(err));
    } finally {
      setPreparing(null);
    }
  }

  function start() {
    if (!file || !crop) return;
    const f = file;
    const p = photo;
    const s = sheet;
    const name = `passport-photos-${size}mm-${paper}`;
    job.run({ bytes: f.size, count: 1 }, async (onProgress) => {
      onProgress("Cropping photo…");
      // Exact print pixels for one photo, e.g. 35 × 45 mm → 413 × 531 px at 300 DPI.
      const one = await runImageJob({ file: f, crop, width: mmToPx(p.wMm), height: mmToPx(p.hMm), format: "jpeg", quality: 0.95, dpi: SHEET_DPI });
      onProgress("Laying out the sheet…");
      const r = await runSheetJob({ photo: one.blob, photoMm: { wMm: p.wMm, hMm: p.hMm }, paper: { wMm: s.wMm, hMm: s.hMm, marginMm: s.marginMm } });
      return {
        files: [
          { name: `${name}.jpg`, blob: r.jpg },
          { name: `${name}.pdf`, blob: r.pdf },
        ],
        details: [`${r.count} copies`, p.label, s.label, `${r.widthPx} × ${r.heightPx} px at ${SHEET_DPI} DPI`],
      };
    });
  }

  return (
    <Panel>
      {!file && !job.output && !preparing && (
        <Dropzone
          accept="image/*,.heic,.heif"
          label="Choose photo"
          hint="A clear, front-facing photo. JPG, PNG, WebP or iPhone HEIC."
          onFiles={(fs) => void pick(fs[0])}
          onReject={job.setError}
        />
      )}
      {preparing && <Busy message={preparing} />}
      {file && url && !job.output && (
        <>
          <Chips label="Photo size" options={SIZE_KEYS} value={size} onChange={setSize} format={sizeChip} />
          <Chips label="Paper" options={PAPER_KEYS} value={paper} onChange={setPaper} format={(k) => PAPERS[k].label} />
          <Cropper key={`${size}-${url}`} src={url} aspect={photo.wMm / photo.hMm} onChange={setCrop} />
          <p className="text-center text-sm text-muted">
            <strong className="text-ink">{count} copies</strong> of {photo.label} on {sheet.label}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            {job.busy ? <Busy message={job.progress} /> : <PrimaryButton onClick={start} disabled={!crop}>Make photo sheet</PrimaryButton>}
            <button type="button" onClick={() => setFile(null)} className="min-h-12 rounded-xl border border-line px-6 font-semibold hover:border-brand-500">
              Choose another
            </button>
          </div>
        </>
      )}
      {job.error && <ErrorBox message={job.error} />}
      {job.output && (
        <>
          <SheetPreview blob={job.output.files[0].blob} />
          <ResultCard
            {...job.output}
            zipName="passport-photo-sheet.zip"
            onDownload={job.onDownload}
            onReset={() => {
              job.reset();
              setFile(null);
            }}
            resetLabel="Make another"
          />
          <p className="text-sm text-muted">
            JPG for a photo lab, PDF for your own printer. Print at 100% or &ldquo;Actual size&rdquo;, not &ldquo;Fit to page&rdquo;, so each photo keeps its exact size.
          </p>
        </>
      )}
    </Panel>
  );
}

function SheetPreview({ blob }: { blob: Blob }) {
  const src = useMemo(() => URL.createObjectURL(blob), [blob]);
  useEffect(() => () => URL.revokeObjectURL(src), [src]);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="Preview of the photo sheet" className="mx-auto block max-h-[50vh] max-w-full rounded-lg border border-line bg-white shadow-sm" />
  );
}
