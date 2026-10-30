import { createWorkerClient } from "./worker-client";

export type GsJob = {
  bytes: ArrayBuffer;
  mode: "level" | "target";
  level?: "high" | "balanced" | "small";
  targetKB?: number;
  gray?: boolean;
};
export type GsResult = { bytes: ArrayBuffer; resolution: number; reachedTarget: boolean };

/** Ghostscript runs from a static classic worker so its 16 MB WASM is only fetched on the Compress PDF page. */
export const runGsJob = createWorkerClient<GsJob, GsResult>(() => new Worker("/workers/gs-worker.js"));
