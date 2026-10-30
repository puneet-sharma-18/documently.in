"use client";

import { useCallback, useState } from "react";
import { friendlyError } from "@/lib/files";
import { track } from "@/lib/track";
import type { ResultFile } from "../ResultCard";

export type JobOutput = {
  files: ResultFile[];
  beforeBytes?: number;
  details?: string[];
  warning?: string;
};

/** Shared state machine for every tool: idle → busy → done | error, with anonymous usage tracking. */
export function useJob(tool: string, preset?: string) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<JobOutput | null>(null);

  const run = useCallback(
    async (inputs: { bytes: number; count: number }, work: (onProgress: (m: string) => void) => Promise<JobOutput>) => {
      setBusy(true);
      setError(null);
      setOutput(null);
      setProgress(null);
      const started = performance.now();
      track({ tool, preset, action: "start", inBytes: inputs.bytes, count: inputs.count });
      try {
        const out = await work(setProgress);
        setOutput(out);
        track({
          tool,
          preset,
          action: "success",
          inBytes: inputs.bytes,
          outBytes: out.files.reduce((n, f) => n + f.blob.size, 0),
          count: inputs.count,
          durationMs: Math.round(performance.now() - started),
        });
      } catch (err) {
        const message = friendlyError(err);
        setError(message);
        track({
          tool,
          preset,
          action: "error",
          inBytes: inputs.bytes,
          count: inputs.count,
          durationMs: Math.round(performance.now() - started),
          error: (err instanceof Error ? err.message : String(err)).slice(0, 160),
        });
      } finally {
        setBusy(false);
        setProgress(null);
      }
    },
    [tool, preset],
  );

  const reset = useCallback(() => {
    setOutput(null);
    setError(null);
  }, []);

  const onDownload = useCallback(() => {
    track({ tool, preset, action: "download" });
  }, [tool, preset]);

  return { busy, progress, error, setError, output, run, reset, onDownload };
}
