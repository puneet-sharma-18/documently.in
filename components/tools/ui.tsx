"use client";

import type { ReactNode } from "react";
import { formatBytes } from "@/lib/files";

export function Panel({ children }: { children: ReactNode }) {
  return <div className="space-y-4 rounded-[var(--radius-card)] border border-line bg-card p-4 shadow-sm sm:p-5">{children}</div>;
}

export function Chips<T extends string | number>({
  label,
  options,
  value,
  onChange,
  format = (v) => String(v),
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  format?: (v: T) => string;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={String(o)}
            type="button"
            aria-pressed={o === value}
            onClick={() => onChange(o)}
            className={`min-h-11 rounded-full border px-4 text-sm font-semibold transition ${
              o === value ? "border-brand-600 bg-brand-600 text-white" : "border-line bg-card hover:border-brand-500"
            }`}
          >
            {format(o)}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  min = 1,
  max = 20000,
  suffix,
}: {
  label: string;
  value: number | "";
  onChange: (v: number | "") => void;
  min?: number;
  max?: number;
  suffix?: string;
}) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <span className="mt-1 flex items-center rounded-xl border border-line bg-card focus-within:border-brand-500">
        <input
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          className="min-h-12 w-full rounded-xl bg-transparent px-3 text-base font-normal outline-none"
        />
        {suffix && <span className="pr-3 text-muted">{suffix}</span>}
      </span>
    </label>
  );
}

export function PrimaryButton({ children, disabled, onClick }: { children: ReactNode; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="min-h-12 w-full rounded-xl bg-brand-600 px-6 text-base font-semibold text-white shadow-sm hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
    >
      {children}
    </button>
  );
}

export function Busy({ message }: { message: string | null }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-brand-50 p-4 text-sm" role="status" aria-live="polite">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" aria-hidden />
      <span>{message ?? "Working on it — your file stays on this device…"}</span>
    </div>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-danger">
      {message}
    </p>
  );
}

export function FileRow({ file, onRemove }: { file: File; onRemove: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-paper px-3 py-2 text-sm">
      <span className="truncate font-medium">{file.name}</span>
      <span className="flex shrink-0 items-center gap-2">
        <span className="text-muted">{formatBytes(file.size)}</span>
        <button type="button" onClick={onRemove} className="min-h-10 rounded-md px-2 text-muted hover:text-danger" aria-label={`Remove ${file.name}`}>
          ✕
        </button>
      </span>
    </div>
  );
}
