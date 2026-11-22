/**
 * Painted scene art for Mandir (paths + natural sizes, so layouts can reserve space).
 * PLACEHOLDER until confirmed project-owned — see CREDITS.md.
 */
const BASE = "/templates/mandir/art";

export type ArtImage = { src: string; w: number; h: number };

const a = (file: string, w: number, h: number): ArtImage => ({ src: `${BASE}/${file}`, w, h });

export const ART = {
  /** Sunset temple with the couple walking up the aisle (hero, and seen through the doors). */
  temple: a("temple.webp", 864, 1536),
  /** Cream page with the floral arch at the top and pavilions in the bottom corners. */
  page: a("page.webp", 864, 1536),
  /**
   * The same page with the paper inside the arch made transparent, layered above the content.
   * Generated from page.webp by `node scripts/mandir-frame.mjs` (re-run if page.webp changes).
   */
  frame: a("frame.webp", 864, 1536),
} as const;

/**
 * Where PAGE/FRAME are sliced for tall screens (rows of the 864×1536 file): above `top` is the
 * arch, below `bottom` the pavilions; the band between (straight vines and gold lines) is the
 * part that stretches. Passed to `.md-paint` (styles.css) as CSS variables by the layout.
 */
export const PAGE_SLICE = { top: 360, bottom: 1020 } as const;

/** Carved temple doors (opening cover). Doors are split at the centre seam and swung open. */
export const GATE = a("gate.webp", 750, 1333);

/**
 * The door opening inside GATE, as % of the image: left, top, width, height. Measured on the
 * 750×1333 file — re-measure if the art is replaced.
 */
export const DOORWAY = { left: 19.33, top: 7.88, width: 61.33, height: 74.27 } as const;

/** Cusped arch outline of the doorway, as % points of the DOORWAY box (left half, apex last). */
const ARCH_LEFT: Array<[number, number]> = [
  [0, 100],
  [0, 14.6],
  [3.3, 10.1],
  [8.7, 7.1],
  [14.1, 5.6],
  [20.7, 4.5],
  [26.1, 3.0],
  [33.7, 2.0],
  [42.4, 0.7],
  [50, 0],
];

const pct = (pts: Array<[number, number]>) =>
  `polygon(${pts.map(([x, y]) => `${x}% ${y}%`).join(", ")})`;

/** Whole doorway (for the scene seen through the doors). */
export const ARCH_CLIP = pct([
  ...ARCH_LEFT,
  ...ARCH_LEFT.slice(0, -1)
    .reverse()
    .map(([x, y]): [number, number] => [100 - x, y]),
]);
/** Each leaf is half the doorway; points rescaled to the leaf box. */
export const LEAF_CLIP = {
  left: pct([...ARCH_LEFT.map(([x, y]): [number, number] => [x * 2, y]), [100, 100]]),
  right: pct([
    [0, 100],
    ...ARCH_LEFT.slice()
      .reverse()
      .map(([x, y]): [number, number] => [100 - x * 2, y]),
  ]),
};
