import type { SheetJob, SheetResult } from "./sheet-render";
import { createWorkerClient } from "./worker-client";

/** Renders a photo sheet (JPG + PDF) off the main thread. */
export const runSheetJob = createWorkerClient<SheetJob, SheetResult>(
  () => new Worker(new URL("./sheet.worker.ts", import.meta.url), { type: "module" }),
);
