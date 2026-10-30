import type { ImageJob, ImageResult } from "./image-core";
import { createWorkerClient } from "./worker-client";

/** Runs the image pipeline off the main thread. */
export const runImageJob = createWorkerClient<ImageJob, ImageResult>(
  () => new Worker(new URL("./image.worker.ts", import.meta.url), { type: "module" }),
);
