import type { ConvertJob, ConvertResult } from "./convert";
import { createWorkerClient } from "./worker-client";

/** Runs format conversion off the main thread. Pass an ImageBitmap source in `transfer` to move it. */
export const runConvertJob = createWorkerClient<ConvertJob, ConvertResult>(
  () => new Worker(new URL("./convert.worker.ts", import.meta.url), { type: "module" }),
);
