type Pending<Result> = {
  resolve: (r: Result) => void;
  reject: (e: Error) => void;
  onProgress?: (message: string) => void;
};

/**
 * Tiny promise RPC over a lazily-created Web Worker. The worker replies to each `{ id, job }`
 * with `{ id, result }` or `{ id, error }`, and may send `{ id, progress }` updates first.
 */
export function createWorkerClient<Job, Result>(spawn: () => Worker) {
  let worker: Worker | null = null;
  let seq = 0;
  const pending = new Map<number, Pending<Result>>();

  function get() {
    if (!worker) {
      worker = spawn();
      worker.onmessage = (e: MessageEvent<{ id: number; result?: Result; error?: string; progress?: string }>) => {
        const p = pending.get(e.data.id);
        if (!p) return;
        if (e.data.progress !== undefined) {
          p.onProgress?.(e.data.progress);
          return;
        }
        pending.delete(e.data.id);
        if (e.data.error !== undefined) p.reject(new Error(e.data.error));
        else p.resolve(e.data.result as Result);
      };
      worker.onerror = (e) => {
        for (const p of pending.values()) p.reject(new Error(e.message || "The tool stopped unexpectedly."));
        pending.clear();
        worker?.terminate();
        worker = null;
      };
    }
    return worker;
  }

  return function run(
    job: Job,
    opts: { transfer?: Transferable[]; onProgress?: (message: string) => void } = {},
  ): Promise<Result> {
    const id = ++seq;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject, onProgress: opts.onProgress });
      get().postMessage({ id, job }, opts.transfer ?? []);
    });
  };
}
