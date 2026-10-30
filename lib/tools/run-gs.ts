import { createWorkerClient } from "./worker-client";

export type GsJob = {
  bytes: ArrayBuffer;
  mode: "level" | "target" | "unlock";
  level?: "high" | "balanced" | "small";
  targetKB?: number;
  gray?: boolean;
  /** unlock mode: the open password; blank for permission-only locks. */
  password?: string;
};
/** `contentBound`: the target was out of reach because text/fonts/vector art, not images, make up the size. */
export type GsResult = { bytes: ArrayBuffer; resolution: number; reachedTarget: boolean; contentBound?: boolean };

/** Ghostscript runs from a static classic worker so its 16 MB WASM is only fetched on the Compress PDF page. */
export const runGsJob = createWorkerClient<GsJob, GsResult>(() => new Worker("/workers/gs-worker.js"));
