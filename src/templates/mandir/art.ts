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
} as const;

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

/**
 * The plain paper "window" inside PAGE's floral arch, as points on the 864×1536 file.
 * The arch edges were traced from the art (5px inside the inner gold line, so the line stays
 * on the frame), each half separately since the painting is not quite symmetric; the lower
 * part around the corner pavilions is hand traced on the left and mirrored.
 * Re-trace if the page art is replaced.
 */
/** Left half of the arch, apex down to where the side becomes straight. */
const WINDOW_ARCH_LEFT: Array<[number, number]> = [
  [431, 13],
  [432, 23],
  [422, 33],
  [404, 45],
  [372, 59],
  [325, 73],
  [308, 83],
  [293, 101],
  [288, 117],
  [228, 119],
  [204, 137],
  [193, 157],
  [190, 173],
  [160, 175],
  [137, 187],
  [124, 201],
  [114, 221],
  [111, 235],
  [112, 255],
  [87, 269],
  [74, 285],
  [68, 297],
  [63, 317],
  [62, 341],
];
/** Right half of the arch, apex down to where the side becomes straight. */
const WINDOW_ARCH_RIGHT: Array<[number, number]> = [
  [433, 25],
  [441, 33],
  [471, 51],
  [503, 63],
  [527, 69],
  [549, 79],
  [566, 95],
  [574, 111],
  [575, 117],
  [634, 119],
  [642, 123],
  [651, 129],
  [663, 143],
  [669, 155],
  [672, 171],
  [703, 175],
  [713, 179],
  [728, 189],
  [739, 201],
  [748, 219],
  [752, 237],
  [751, 255],
  [765, 261],
  [778, 271],
  [786, 281],
  [795, 297],
  [801, 323],
  [801, 341],
];
/** Left side below the arch, around the pavilion, to the bottom edge. */
const PAVILION_LEFT: Array<[number, number]> = [
  [100, 1140],
  [106, 1186],
  [148, 1204],
  [172, 1240],
  [190, 1282],
  [196, 1310],
  [182, 1332],
  [182, 1390],
  [240, 1400],
  [290, 1410],
  [315, 1450],
  [325, 1536],
];

const WINDOW_PATH = `M${[
  ...WINDOW_ARCH_LEFT,
  [WINDOW_ARCH_LEFT.at(-1)![0], 1132],
  ...PAVILION_LEFT,
  ...PAVILION_LEFT.slice()
    .reverse()
    .map(([x, y]): [number, number] => [ART.page.w - x, y]),
  [WINDOW_ARCH_RIGHT.at(-1)![0], 1132],
  ...WINDOW_ARCH_RIGHT.slice().reverse(),
]
  .map(([x, y]) => `${x} ${y}`)
  .join("L")}Z`;

/**
 * Mask that keeps only PAGE's frame (arch, floral border, pavilions) and cuts out the window,
 * with a slightly feathered edge. Same 9:16 box as the art, so `mask-size: cover` lines up
 * with `object-fit: cover`.
 */
export const FRAME_MASK = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ART.page.w} ${ART.page.h}" width="${ART.page.w}" height="${ART.page.h}"><filter id="f"><feGaussianBlur stdDeviation="3"/></filter><path filter="url(#f)" fill-rule="evenodd" fill="#fff" d="M-20 -20H${ART.page.w + 20}V${ART.page.h + 20}H-20Z${WINDOW_PATH}"/></svg>`,
)}")`;
