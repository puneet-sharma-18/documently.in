// Pure layout maths for a printable sheet of identical photos. No DOM, no canvas: safe to import
// anywhere (UI shows the copy count before rendering) and testable in Node.

export const SHEET_DPI = 300;

export const PHOTO_SIZES = {
  "35x45": { label: "35 × 45 mm", note: "India passport & visa", wMm: 35, hMm: 45 },
  "51x51": { label: "2 × 2 in", note: "51 × 51 mm", wMm: 51, hMm: 51 },
  "35x35": { label: "35 × 35 mm", note: "square", wMm: 35, hMm: 35 },
} as const;
export type PhotoSizeKey = keyof typeof PHOTO_SIZES;

export const PAPERS = {
  "4x6": { label: "4 × 6 in photo paper", wMm: 101.6, hMm: 152.4, marginMm: 3 },
  a4: { label: "A4", wMm: 210, hMm: 297, marginMm: 8 },
} as const;
export type PaperKey = keyof typeof PAPERS;

/** Space between neighbouring photos, for the scissors. */
export const GAP_MM = 2;

export type Cell = { xMm: number; yMm: number };

export type SheetLayout = {
  /** Page size in mm, after choosing portrait or landscape. */
  pageWMm: number;
  pageHMm: number;
  landscape: boolean;
  cols: number;
  rows: number;
  count: number;
  photoWMm: number;
  photoHMm: number;
  /** Top-left corner of each photo, measured from the page's top-left, in mm. */
  cells: Cell[];
};

const fit = (avail: number, size: number, gap: number) => Math.max(0, Math.floor((avail + gap + 1e-9) / (size + gap)));

function grid(pageW: number, pageH: number, margin: number, pw: number, ph: number, gap: number) {
  const cols = fit(pageW - 2 * margin, pw, gap);
  const rows = fit(pageH - 2 * margin, ph, gap);
  return { cols, rows, count: cols * rows };
}

/**
 * Tiles as many photos as fit inside the paper's margins, trying both page orientations
 * (photos are never rotated). The grid is centred on the page. Ties keep portrait.
 */
export function layoutSheet(photo: { wMm: number; hMm: number }, paper: { wMm: number; hMm: number; marginMm: number }, gapMm = GAP_MM): SheetLayout {
  const portrait = grid(paper.wMm, paper.hMm, paper.marginMm, photo.wMm, photo.hMm, gapMm);
  const land = grid(paper.hMm, paper.wMm, paper.marginMm, photo.wMm, photo.hMm, gapMm);
  const landscape = land.count > portrait.count;
  const g = landscape ? land : portrait;
  const pageWMm = landscape ? paper.hMm : paper.wMm;
  const pageHMm = landscape ? paper.wMm : paper.hMm;
  const blockW = g.cols * photo.wMm + Math.max(0, g.cols - 1) * gapMm;
  const blockH = g.rows * photo.hMm + Math.max(0, g.rows - 1) * gapMm;
  const x0 = (pageWMm - blockW) / 2;
  const y0 = (pageHMm - blockH) / 2;
  const cells: Cell[] = [];
  for (let r = 0; r < g.rows; r++)
    for (let c = 0; c < g.cols; c++) cells.push({ xMm: x0 + c * (photo.wMm + gapMm), yMm: y0 + r * (photo.hMm + gapMm) });
  return { pageWMm, pageHMm, landscape, cols: g.cols, rows: g.rows, count: g.count, photoWMm: photo.wMm, photoHMm: photo.hMm, cells };
}

export const mmToPx = (mm: number, dpi = SHEET_DPI) => Math.round((mm / 25.4) * dpi);
export const mmToPt = (mm: number) => (mm / 25.4) * 72;
