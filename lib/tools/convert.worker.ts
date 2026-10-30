import { convertImage, type ConvertJob } from "./convert";

self.onmessage = async (e: MessageEvent<{ id: number; job: ConvertJob }>) => {
  const { id, job } = e.data;
  try {
    self.postMessage({ id, result: await convertImage(job) });
  } catch (err) {
    self.postMessage({ id, error: err instanceof Error ? err.message : String(err) });
  }
};
