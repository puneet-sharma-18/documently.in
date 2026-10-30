import { processImage, type ImageJob } from "./image-core";

self.onmessage = async (e: MessageEvent<{ id: number; job: ImageJob }>) => {
  const { id, job } = e.data;
  try {
    self.postMessage({ id, result: await processImage(job) });
  } catch (err) {
    self.postMessage({ id, error: err instanceof Error ? err.message : String(err) });
  }
};
