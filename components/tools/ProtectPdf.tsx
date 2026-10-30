"use client";

import { useState } from "react";
import Dropzone from "../Dropzone";
import ResultCard from "../ResultCard";
import { Busy, ErrorBox, FileRow, Panel, PrimaryButton } from "./ui";
import { useJob } from "./useJob";
import type { ToolProps } from "./types";
import { UserFacingError, isPdf, renameFile } from "@/lib/files";
import { runGsJob } from "@/lib/tools/run-gs";

const ERRORS: Record<string, string> = {
  NEEDS_PASSWORD: "This PDF already has an open password. Remove it with Unlock PDF first, then add your new one here.",
  WRONG_PASSWORD: "This PDF already has an open password. Remove it with Unlock PDF first, then add your new one here.",
  NO_PASSWORD: "Type a password first.",
};
// PDF viewers handle non-English password characters inconsistently, and the PDF standard used here
// reads only the first 32 characters, so keep passwords to typeable ASCII within that length.
const ALLOWED = /^[\x21-\x7E ]*$/;
const MAX = 32;

function PasswordInput({
  label,
  value,
  onChange,
  show,
  onEnter,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onEnter?: () => void;
}) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
        autoComplete="new-password"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        maxLength={MAX}
        className="mt-1 min-h-12 w-full rounded-xl border border-line bg-card px-3 text-base font-normal outline-none focus:border-ink"
      />
    </label>
  );
}

export default function ProtectPdf({ tool, presetSlug }: ToolProps) {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const job = useJob(tool, presetSlug);

  const problem = !password
    ? null
    : !ALLOWED.test(password)
      ? "Use English letters, numbers and symbols only. Other characters may not open in every PDF reader."
      : password.length < 4
        ? "Use at least 4 characters."
        : confirm && confirm !== password
          ? "The two passwords don't match."
          : null;
  const ready = Boolean(password) && confirm === password && !problem;

  function clear() {
    setFile(null);
    setPassword("");
    setConfirm("");
    setShow(false);
  }

  function start() {
    if (!file || !ready || job.busy) return;
    const f = file;
    const pw = password;
    job.run({ bytes: f.size, count: 1 }, async (onProgress) => {
      const head = new TextDecoder().decode(await f.slice(0, 1024).arrayBuffer());
      if (!head.includes("%PDF-")) throw new Error("Invalid PDF: no PDF header");
      const bytes = await f.arrayBuffer();
      try {
        const res = await runGsJob({ bytes, mode: "protect", password: pw }, { transfer: [bytes], onProgress });
        return {
          files: [{ name: renameFile(f.name, "-protected", "pdf"), blob: new Blob([res.bytes], { type: "application/pdf" }) }],
          details: ["Password added (128-bit encryption)", "Pages and images unchanged"],
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
          hint="Lock a PDF with a password before you email or share it. Processed on your device."
          onFiles={(fs) => {
            if (!isPdf(fs[0])) return job.setError("That isn't a PDF. Pick a .pdf file.");
            job.setError(null);
            setFile(fs[0]);
          }}
          onReject={job.setError}
        />
      )}

      {file && !job.output && (
        <>
          <FileRow file={file} onRemove={clear} />
          <PasswordInput label="New password" value={password} onChange={setPassword} show={show} />
          <PasswordInput label="Type it again" value={confirm} onChange={setConfirm} show={show} onEnter={start} />
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold">
            <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="h-5 w-5 shrink-0 accent-brand-600" />
            Show password
          </label>
          {problem && <p className="text-sm text-danger">{problem}</p>}
          <p className="text-xs leading-relaxed text-muted">
            Anyone opening the PDF will need this password, and it can&apos;t be recovered if you forget it, so note it somewhere safe. Your password and
            file never leave this device.
          </p>
          {job.busy ? (
            <Busy message={job.progress} />
          ) : (
            <PrimaryButton onClick={start} disabled={!ready}>
              Add password
            </PrimaryButton>
          )}
          {!job.busy && <p className="text-xs text-muted">First use downloads the PDF engine once (about 11 MB); after that it loads from your browser cache.</p>}
        </>
      )}

      {job.error && <ErrorBox message={job.error} />}
      {job.output && (
        <ResultCard
          {...job.output}
          onDownload={job.onDownload}
          onReset={() => {
            job.reset();
            clear();
          }}
        />
      )}
    </Panel>
  );
}
