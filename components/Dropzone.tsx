"use client";

import { useId, useRef, useState } from "react";

type Props = {
  accept: string;
  multiple?: boolean;
  label: string;
  hint?: string;
  maxSizeMB?: number;
  onFiles: (files: File[]) => void;
  onReject?: (message: string) => void;
  compact?: boolean;
};

export default function Dropzone({ accept, multiple, label, hint, maxSizeMB = 200, onFiles, onReject, compact }: Props) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  function take(list: FileList | null) {
    if (!list?.length) return;
    const files = Array.from(list);
    const tooBig = files.find((f) => f.size > maxSizeMB * 1024 * 1024);
    if (tooBig) {
      onReject?.(`"${tooBig.name}" is larger than ${maxSizeMB} MB. Try a smaller file — big files can crash phone browsers.`);
      return;
    }
    onFiles(multiple ? files : files.slice(0, 1));
    if (input.current) input.current.value = "";
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        take(e.dataTransfer.files);
      }}
      className={`rounded-[var(--radius-card)] border-2 border-dashed text-center transition ${
        over ? "border-brand-500 bg-brand-50" : "border-brand-200 bg-card"
      } ${compact ? "px-4 py-5" : "px-4 py-10 sm:py-12"}`}
    >
      <input ref={input} id={id} type="file" accept={accept} multiple={multiple} className="sr-only" onChange={(e) => take(e.target.files)} />
      <label
        htmlFor={id}
        className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-brand-600 px-6 text-base font-semibold text-white shadow-sm hover:bg-brand-700"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {label}
      </label>
      {!compact && <p className="mt-3 hidden text-sm text-muted sm:block">or drop {multiple ? "files" : "a file"} here</p>}
      {hint && <p className="mt-2 text-sm text-muted">{hint}</p>}
    </div>
  );
}
