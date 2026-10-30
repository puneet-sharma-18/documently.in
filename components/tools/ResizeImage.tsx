"use client";

import { useEffect, useState } from "react";
import Dropzone from "../Dropzone";
import ResultCard from "../ResultCard";
import { Busy, Chips, ErrorBox, FileRow, NumberField, Panel, PrimaryButton } from "./ui";
import { useJob } from "./useJob";
import type { ToolProps } from "./types";
import { isHeic, isImage, renameFile } from "@/lib/files";
import { runImageJob } from "@/lib/tools/run-image";

type Unit = "px" | "cm";
const DPI_OPTIONS = [72, 96, 150, 200, 300] as const;

export default function ResizeImage({ tool, presetSlug, config }: ToolProps) {
  const [file, setFile] = useState<File | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [unit, setUnit] = useState<Unit>("px");
  const [w, setW] = useState<number | "">(config?.widthPx ?? "");
  const [h, setH] = useState<number | "">(config?.heightPx ?? "");
  const [lock, setLock] = useState(!(config?.widthPx && config?.heightPx));
  const [dpi, setDpi] = useState<number>(config?.dpi ?? 200);
  const [maxKB, setMaxKB] = useState<number | "">(config?.maxKB ?? "");
  const [minKB, setMinKB] = useState<number | "">(config?.minKB ?? "");
  const job = useJob(tool, presetSlug);

  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    createImageBitmap(file)
      .then((b) => {
        if (cancelled) return b.close();
        setNatural({ w: b.width, h: b.height });
        if (!config?.widthPx && !config?.heightPx) {
          setW(b.width);
          setH(b.height);
        }
        b.close();
      })
      .catch(() => job.setError("We couldn't read this image. Try a JPG or PNG."));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  const toPx = (v: number) => (unit === "cm" ? Math.round((v / 2.54) * dpi) : Math.round(v));
  const fromPx = (v: number) => (unit === "cm" ? Math.round((v / dpi) * 2.54 * 100) / 100 : v);

  function changeW(v: number | "") {
    setW(v);
    if (lock && natural && v !== "") setH(Number((((v as number) * natural.h) / natural.w).toFixed(unit === "cm" ? 2 : 0)));
  }
  function changeH(v: number | "") {
    setH(v);
    if (lock && natural && v !== "") setW(Number((((v as number) * natural.w) / natural.h).toFixed(unit === "cm" ? 2 : 0)));
  }
  function switchUnit(u: Unit) {
    if (u === unit) return;
    const pxW = w === "" ? "" : toPx(w);
    const pxH = h === "" ? "" : toPx(h);
    setUnit(u);
    setW(pxW === "" ? "" : u === "cm" ? Math.round((pxW / dpi) * 2.54 * 100) / 100 : pxW);
    setH(pxH === "" ? "" : u === "cm" ? Math.round((pxH / dpi) * 2.54 * 100) / 100 : pxH);
  }

  const outW = w === "" ? 0 : toPx(w);
  const outH = h === "" ? 0 : toPx(h);
  const valid = outW >= 8 && outH >= 8 && outW <= 10000 && outH <= 10000 && (minKB === "" || maxKB === "" || minKB < maxKB);

  function start() {
    if (!file || !valid) return;
    const f = file;
    job.run({ bytes: f.size, count: 1 }, async () => {
      const r = await runImageJob({
        file: f,
        width: outW,
        height: outH,
        format: "jpeg",
        quality: 0.92,
        maxKB: maxKB === "" ? undefined : maxKB,
        minKB: minKB === "" ? undefined : minKB,
        dpi,
      });
      return {
        files: [{ name: renameFile(f.name, `-${r.width}x${r.height}`, "jpg"), blob: r.blob }],
        beforeBytes: f.size,
        details: [`${r.width} × ${r.height} px`, `${dpi} DPI`, `${fromPx(r.width)} × ${fromPx(r.height)} ${unit}`],
        warning: r.message,
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

      {file && !job.output && (
        <>
          <FileRow file={file} onRemove={() => setFile(null)} />
          {natural && <p className="text-sm text-muted">Original: {natural.w} × {natural.h} px</p>}
          <Chips label="Units" options={["px", "cm"] as Unit[]} value={unit} onChange={switchUnit} format={(u) => (u === "px" ? "Pixels" : "Centimetres")} />
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Width" value={w} onChange={changeW} suffix={unit} />
            <NumberField label="Height" value={h} onChange={changeH} suffix={unit} />
          </div>
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input type="checkbox" checked={lock} onChange={(e) => setLock(e.target.checked)} className="h-5 w-5 accent-brand-600" />
            Keep proportions (if off, the photo is centre-cropped to fit — never stretched)
          </label>
          <Chips label="DPI (print resolution saved in the file)" options={DPI_OPTIONS} value={dpi as (typeof DPI_OPTIONS)[number]} onChange={setDpi} />
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Min size (optional)" value={minKB} onChange={setMinKB} min={1} suffix="KB" />
            <NumberField label="Max size (optional)" value={maxKB} onChange={setMaxKB} min={2} suffix="KB" />
          </div>
          {job.busy ? (
            <Busy message={job.progress} />
          ) : (
            <PrimaryButton onClick={start} disabled={!valid}>
              Resize to {outW || "?"} × {outH || "?"} px
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
