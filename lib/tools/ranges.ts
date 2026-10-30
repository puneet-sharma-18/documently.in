/** Parses "1-3, 5, 8-end" into groups of zero-based page indexes. Throws a readable error on bad input. */
export function parseRanges(input: string, pageCount: number): number[][] {
  const groups: number[][] = [];
  for (const raw of input.split(",")) {
    const part = raw.trim();
    if (!part) continue;
    const m = part.match(/^(\d+)\s*(?:-\s*(\d+|end))?$/i);
    if (!m) throw new Error(`"${part}" isn't a valid page or range. Use a format like 1-3, 5, 8-end.`);
    const start = Number(m[1]);
    const end = m[2] ? (m[2].toLowerCase() === "end" ? pageCount : Number(m[2])) : start;
    if (start < 1 || end > pageCount || start > end)
      throw new Error(`"${part}" is outside this PDF — it has ${pageCount} page${pageCount === 1 ? "" : "s"}.`);
    groups.push(Array.from({ length: end - start + 1 }, (_, i) => start - 1 + i));
  }
  if (!groups.length) throw new Error("Enter at least one page or range, e.g. 1-3.");
  return groups;
}
