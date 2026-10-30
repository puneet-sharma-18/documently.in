import { runPdfJob, type PdfJob } from "./pdf-core";

self.onmessage = async (e: MessageEvent<{ id: number; job: PdfJob }>) => {
  const { id, job } = e.data;
  try {
    const result = await runPdfJob(job);
    (self as unknown as Worker).postMessage({ id, result }, result.outputs.map((o) => o.bytes.buffer as ArrayBuffer));
  } catch (err) {
    self.postMessage({ id, error: err instanceof Error ? err.message : String(err) });
  }
};
