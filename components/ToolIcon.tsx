// Simple line icons drawn for Documently. 24×24 grid, stroke-based.
const paths: Record<string, string> = {
  "compress-pdf": "M7 3h7l4 4v14H7z M14 3v4h4 M12 10v6 M9.5 13.5 12 16l2.5-2.5",
  "compress-image": "M4 5h16v14H4z M4 15l4-4 4 4 3-3 5 5 M12 3v5 M10 6l2 2 2-2",
  "resize-image": "M4 4h7 M4 4v7 M20 20h-7 M20 20v-7 M4 4l7 7 M20 20l-7-7",
  "exam-photo-signature": "M5 3h14v18H5z M12 10a2.5 2.5 0 1 0 0-.01 M8 16c1-2 7-2 8 0 M8 19h8",
  "jpg-to-pdf": "M3 6h9v9H3z M3 13l3-3 3 3 M14 9h3l4 4v8h-7z M17 9v4h4",
  "pdf-to-jpg": "M3 3h7l4 4v8H3z M10 3v4h4 M12 13h9v8h-9z M12 19l3-3 3 3",
  "merge-pdf": "M4 3h6v8H4z M14 3h6v8h-6z M7 11v3h10v-3 M12 14v7 M9.5 18.5 12 21l2.5-2.5",
  "split-pdf": "M9 3h6v8H9z M12 11v3 M5 14h14 M5 14v7 M19 14v7 M3 21h4 M17 21h4",
  "rotate-pdf": "M7 3h8l4 4v8 M15 3v4h4 M4 13a8 8 0 0 0 14 5 M4 13V9 M4 13h4",
  "crop-image": "M6 2v16h16 M2 6h16v16",
  "unlock-pdf": "M5 11h14v10H5z M8 11V7a4 4 0 0 1 7.5-2 M12 15v2",
};

export default function ToolIcon({ slug, className = "h-6 w-6" }: { slug: string; className?: string }) {
  const d = paths[slug] ?? paths["compress-pdf"];
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {d.split(" M").map((seg, i) => (
        <path key={i} d={i === 0 ? seg : `M${seg}`} />
      ))}
    </svg>
  );
}
