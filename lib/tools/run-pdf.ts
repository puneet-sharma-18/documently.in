import type { PdfJob, PdfResult } from "./pdf-core";
import { createWorkerClient } from "./worker-client";

/** Runs pdf-lib operations off the main thread. */
export const runPdfJob = createWorkerClient<PdfJob, PdfResult>(
  () => new Worker(new URL("./pdf.worker.ts", import.meta.url), { type: "module" }),
);
