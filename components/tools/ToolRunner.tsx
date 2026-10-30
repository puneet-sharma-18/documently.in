"use client";

import dynamic from "next/dynamic";
import type { ToolProps } from "./types";

// Each tool is its own chunk, so a page only ships the code for the tool it shows.
const registry = {
  "compress-pdf": dynamic(() => import("./CompressPdf")),
  "compress-image": dynamic(() => import("./CompressImage")),
  "resize-image": dynamic(() => import("./ResizeImage")),
  "exam-photo-signature": dynamic(() => import("./ExamPhotoSignature")),
  "jpg-to-pdf": dynamic(() => import("./JpgToPdf")),
  "pdf-to-jpg": dynamic(() => import("./PdfToJpg")),
  "merge-pdf": dynamic(() => import("./MergePdf")),
  "split-pdf": dynamic(() => import("./SplitPdf")),
  "rotate-pdf": dynamic(() => import("./RotatePdf")),
  "crop-image": dynamic(() => import("./CropImage")),
  "unlock-pdf": dynamic(() => import("./UnlockPdf")),
  "add-page-numbers": dynamic(() => import("./AddPageNumbers")),
  "watermark-pdf": dynamic(() => import("./WatermarkPdf")),
  "organize-pdf": dynamic(() => import("./OrganizePdf")),
  "protect-pdf": dynamic(() => import("./ProtectPdf")),
  "convert-image": dynamic(() => import("./ConvertImage")),
  "passport-photo-sheet": dynamic(() => import("./PassportPhotoSheet")),
} as const;

export const toolSlugs = Object.keys(registry);

export default function ToolRunner(props: ToolProps) {
  const Tool = registry[props.tool as keyof typeof registry];
  if (!Tool) return null;
  return <Tool {...props} />;
}
