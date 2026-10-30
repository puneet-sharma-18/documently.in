"use client";

import { useEffect, useRef, useState } from "react";
import type { CropRect } from "@/lib/tools/image-core";

type Props = {
  src: string;
  /** width / height; null = free crop. Remount (change `key`) to apply a new aspect. */
  aspect: number | null;
  onChange: (rect: CropRect) => void;
};

type Drag = { kind: "move" | "nw" | "ne" | "sw" | "se"; startX: number; startY: number; rect: CropRect };

/** Crop box over an image. Coordinates reported in the image's natural pixels. */
export default function Cropper({ src, aspect, onChange }: Props) {
  const img = useRef<HTMLImageElement>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [displayW, setDisplayW] = useState(0);
  const [rect, setRect] = useState<CropRect | null>(null);
  const drag = useRef<Drag | null>(null);

  // Track the rendered image width so the overlay stays aligned on rotate/resize.
  useEffect(() => {
    const el = img.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setDisplayW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function onLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const n = { w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight };
    const r = initialRect(n.w, n.h, aspect);
    setNatural(n);
    setDisplayW(e.currentTarget.clientWidth);
    setRect(r);
    onChange(r);
  }

  const s = natural && displayW ? displayW / natural.w : 0;

  function onPointerDown(e: React.PointerEvent<HTMLElement>) {
    if (!rect) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const kind = (e.currentTarget.dataset.kind ?? "move") as Drag["kind"];
    drag.current = { kind, startX: e.clientX, startY: e.clientY, rect };
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d || !natural || !s) return;
    const dx = (e.clientX - d.startX) / s;
    const dy = (e.clientY - d.startY) / s;
    setRect(d.kind === "move" ? moveRect(d.rect, dx, dy, natural) : resizeRect(d.rect, d.kind, dx, dy, aspect, natural));
  }

  function onPointerUp() {
    if (drag.current && rect) onChange(rect);
    drag.current = null;
  }

  return (
    <div className="relative mx-auto w-fit max-w-full touch-none select-none" onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={img} src={src} alt="Photo to crop" className="block max-h-[60vh] max-w-full" draggable={false} onLoad={onLoad} />
      {rect && s > 0 && (
        <div
          className="absolute cursor-move border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] outline outline-1 outline-brand-600"
          style={{ left: rect.x * s, top: rect.y * s, width: rect.w * s, height: rect.h * s }}
          data-kind="move"
          onPointerDown={onPointerDown}
        >
          <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <span key={i} className="border border-white/30" />
            ))}
          </div>
          {(["nw", "ne", "sw", "se"] as const).map((h) => (
            <span
              key={h}
              role="presentation"
              data-kind={h}
              onPointerDown={onPointerDown}
              className={`absolute h-7 w-7 rounded-full border-2 border-white bg-brand-600 ${h.includes("n") ? "-top-3.5" : "-bottom-3.5"} ${
                h.includes("w") ? "-left-3.5" : "-right-3.5"
              } ${h === "nw" || h === "se" ? "cursor-nwse-resize" : "cursor-nesw-resize"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function initialRect(w: number, h: number, aspect: number | null): CropRect {
  if (!aspect) return { x: w * 0.05, y: h * 0.05, w: w * 0.9, h: h * 0.9 };
  let cw = w * 0.9,
    ch = cw / aspect;
  if (ch > h * 0.9) {
    ch = h * 0.9;
    cw = ch * aspect;
  }
  return { x: (w - cw) / 2, y: (h - ch) / 2, w: cw, h: ch };
}

function moveRect(r: CropRect, dx: number, dy: number, n: { w: number; h: number }): CropRect {
  return { ...r, x: clamp(r.x + dx, 0, n.w - r.w), y: clamp(r.y + dy, 0, n.h - r.h) };
}

function resizeRect(r: CropRect, corner: "nw" | "ne" | "sw" | "se", dx: number, dy: number, aspect: number | null, n: { w: number; h: number }): CropRect {
  const min = 24;
  // Anchor is the opposite corner.
  const ax = corner.includes("w") ? r.x + r.w : r.x;
  const ay = corner.includes("n") ? r.y + r.h : r.y;
  let w = corner.includes("w") ? r.w - dx : r.w + dx;
  let h = corner.includes("n") ? r.h - dy : r.h + dy;
  const maxW = corner.includes("w") ? ax : n.w - ax;
  const maxH = corner.includes("n") ? ay : n.h - ay;
  w = clamp(w, min, maxW);
  h = clamp(h, min, maxH);
  if (aspect) {
    if (w / h > aspect) w = h * aspect;
    else h = w / aspect;
    if (w > maxW) {
      w = maxW;
      h = w / aspect;
    }
    if (h > maxH) {
      h = maxH;
      w = h * aspect;
    }
  }
  return { x: corner.includes("w") ? ax - w : ax, y: corner.includes("n") ? ay - h : ay, w, h };
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
