import { renderSheet, type SheetJob } from "./sheet-render";

self.onmessage = async (e: MessageEvent<{ id: number; job: SheetJob }>) => {
  const { id, job } = e.data;
  try {
    self.postMessage({ id, result: await renderSheet(job) });
  } catch (err) {
    self.postMessage({ id, error: err instanceof Error ? err.message : String(err) });
  }
};
