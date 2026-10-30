"use client";

import { useState } from "react";
import Dropzone from "../Dropzone";
import ResultCard from "../ResultCard";
import { Busy, ErrorBox, FileRow, Panel, PrimaryButton } from "./ui";
import { useJob } from "./useJob";
import type { ToolProps } from "./types";
import { UserFacingError, isEncryptedPdf, isPdf, renameFile } from "@/lib/files";
import { runGsJob } from "@/lib/tools/run-gs";

const ERRORS: Record<string, string> = {
  WRONG_PASSWORD: "That password didn't work. PDF passwords are case-sensitive — check Caps Lock and try again.",
  NEEDS_PASSWORD: "This PDF needs its open password. Type it in the box above and try again.",
};

export default function UnlockPdf({ tool, presetSlug }: ToolProps) {
  const [file, setFile] = useState<File | null>(null);
  const [locked, setLocked] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const job = useJob(tool, presetSlug);

  async function pick(f: File) {
    setFile(f);
    setLocked(isEncryptedPdf(new Uint8Array(await f.arrayBuffer())));
  }

  function start() {
    if (!file) return;
    const f = file;
    job.run({ bytes: f.size, count: 1 }, async (onProgress) => {
      const head = new TextDecoder().decode(await f.slice(0, 1024).arrayBuffer());
      if (!head.includes("%PDF-")) throw new Error("Invalid PDF: no PDF header");
      const bytes = await f.arrayBuffer();
      try {
        const res = await runGsJob({ bytes, mode: "unlock", password }, { transfer: [bytes], onProgress });
        return {
          files: [{ name: renameFile(f.name, "-unlocked", "pdf"), blob: new Blob([res.bytes], { type: "application/pdf" }) }],
          details: ["Password removed", "Pages and images unchanged"],
        };
      } catch (err) {
        const code = err instanceof Error ? err.message : "";
        throw ERRORS[code] ? new UserFacingError(ERRORS[code]) : err;
      }
    });
  }

  return (
    <Panel>
      {!file && !job.output && (
        <Dropzone
          accept="application/pdf,.pdf"
          label="Choose PDF"
          hint="Works for e-Aadhaar, bank statements and salary slips. Processed on your device."
          onFiles={(fs) => {
            if (!isPdf(fs[0])) return job.setError("That isn't a PDF. Pick a .pdf file.");
            job.setError(null);
            void pick(fs[0]);
          }}
          onReject={job.setError}
        />
      )}

      {file && !job.output && (
        <>
          <FileRow
            file={file}
            onRemove={() => {
              setFile(null);
              setLocked(null);
              setPassword("");
            }}
          />
          {locked === false ? (
            <p className="rounded-xl bg-brand-50 p-4 text-sm">
              This PDF isn&apos;t password-protected, so there&apos;s nothing to remove. You can upload it as it is.
            </p>
          ) : (
            <>
              <label className="block text-sm font-semibold">
                PDF password
                <span className="mt-1 flex items-center rounded-xl border border-line bg-card focus-within:border-ink">
                  <input
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !job.busy && start()}
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    placeholder="The password you use to open this PDF"
                    className="min-h-12 w-full rounded-xl bg-transparent px-3 text-base font-normal outline-none"
                  />
                  <button type="button" onClick={() => setShow(!show)} className="min-h-10 shrink-0 px-3 text-sm font-semibold text-muted hover:text-ink">
                    {show ? "Hide" : "Show"}
                  </button>
                </span>
              </label>
              <p className="text-xs leading-relaxed text-muted">
                PDFs that open fine but block printing or copying don&apos;t need a password — leave it blank. Your password and file never leave this
                device. Only unlock PDFs that belong to you.
              </p>
              {job.busy ? <Busy message={job.progress} /> : <PrimaryButton onClick={start}>Remove password</PrimaryButton>}
              {!job.busy && <p className="text-xs text-muted">First use downloads the PDF engine once (about 11 MB); after that it loads from your browser cache.</p>}
            </>
          )}
        </>
      )}

      {job.error && <ErrorBox message={job.error} />}
      {job.output && (
        <ResultCard
          {...job.output}
          onDownload={job.onDownload}
          onReset={() => {
            job.reset();
            setFile(null);
            setLocked(null);
            setPassword("");
          }}
        />
      )}
    </Panel>
  );
}
