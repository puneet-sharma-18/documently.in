"use client";

import { useState } from "react";
import Dropzone from "../Dropzone";
import ResultCard from "../ResultCard";
import { Busy, Chips, ErrorBox, FileRow, Panel, PrimaryButton } from "./ui";
import { useJob } from "./useJob";
import type { ToolProps } from "./types";
import { isPdf } from "@/lib/files";
import { renderPdfToJpgs } from "@/lib/tools/pdf-render";

type Quality = 100 | 150 | 300;

export default function PdfToJpg({ tool, presetSlug }: ToolProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dpi, setDpi] = useState<Quality>(150);
  const job = useJob(tool, presetSlug);

  function start() {
    if (!file) return;
    const f = file;
    job.run({ bytes: f.size, count: 1 }, async (onProgress) => {
      const pages = await renderPdfToJpgs(f, { dpi, quality: 0.88 }, (done, total) => onProgress(`Converting page ${done} of ${total}…`));
      const base = f.name.replace(/\.pdf$/i, "") || "page";
      return {
        files: pages.map((p) => ({ name: pages.length === 1 ? `${base}.jpg` : `${base}-page-${p.page}.jpg`, blob: p.blob })),
        details: [`${pages.length} image${pages.length > 1 ? "s" : ""}`, `${dpi} DPI`],
      };
    });
  }

  return (
    <Panel>
      {!file && !job.output && (
        <Dropzone
          accept="application/pdf,.pdf"
          label="Choose PDF"
          hint="Every page becomes a JPG. Processed on your device."
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
          <Chips label="Image quality" options={[100, 150, 300] as Quality[]} value={dpi} onChange={setDpi} format={(d) => (d === 100 ? "Small (100 DPI)" : d === 150 ? "Standard (150 DPI)" : "Print (300 DPI)")} />
          {job.busy ? <Busy message={job.progress} /> : <PrimaryButton onClick={start}>Convert to JPG</PrimaryButton>}
        </>
      )}
      {job.error && <ErrorBox message={job.error} />}
      {job.output && (
        <ResultCard
          {...job.output}
          zipName={`${file?.name.replace(/\.pdf$/i, "") || "pages"}-jpg.zip`}
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
