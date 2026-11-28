/**
 * Painted art for Kashi (paths + natural sizes, so layouts can reserve space).
 * PLACEHOLDER until confirmed project-owned — see CREDITS.md.
 */
// Served through /t-art so admins can replace art from the portal (docs/19 §4.6); the files live
// in /public/templates/kashi/art/.
const BASE = "/t-art/kashi";

export type ArtImage = { src: string; w: number; h: number };

const a = (file: string, w: number, h: number): ArtImage => ({ src: `${BASE}/${file}`, w, h });

export const ART = {
  /** Watercolour sky (top darker blue → pale horizon). */
  sky: a("sky.webp", 720, 1082),
  clouds: [a("cloud-1.webp", 560, 373), a("cloud-2.webp", 560, 373)],
  paperClouds: [a("paper-cloud-1.webp", 600, 294), a("paper-cloud-2.webp", 600, 362)],
  /** Carved stone arch, open centre (cover). */
  arch: a("arch.webp", 900, 1613),
  /** Arch framing the ghats and palms, open sky (blessing). */
  ghatArch: a("ghat-arch.webp", 900, 1659),
  /** Painted ghats on the river; transparent sky (hero, families, closing). */
  ghats: a("ghats.webp", 900, 1253),
  /** Plain sandstone arch frame (couple diorama). */
  sandstoneArch: a("sandstone-arch.webp", 900, 1665),
  paperGhats: a("paper-ghats.webp", 900, 1352),
  paperWaves: a("paper-waves.webp", 900, 1352),
  paperCouple: a("paper-couple.webp", 760, 1142),
  /** Painted mural frames with a cream centre (sliced with border-image in styles.css). */
  muralNavy: a("mural-navy.webp", 900, 1608),
  muralSage: a("mural-sage.webp", 900, 1608),
  ganesha: a("ganesha.webp", 320, 320),
  /** Event card art (painted Mehendi; photos for the rest, cropped from one supplied sheet). */
  mehendi: a("mehendi.webp", 720, 960),
  eventHaldi: a("event-haldi.webp", 498, 500),
  eventSangeet: a("event-sangeet.webp", 498, 500),
  eventWedding: a("event-wedding.webp", 497, 500),
  eventReception: a("event-reception.webp", 640, 423),
  eventGeneric: a("event-generic.webp", 640, 423),
  /** Scratch-card foil: polished gold with sparkles (generated, project-owned). */
  scratchFoil: a("scratch-foil.webp", 720, 600),
} as const;

/**
 * Mural frames are sliced as a border image: rows/columns of the 900×1608 files. Above `top` is
 * the arched head, below `bottom` the base; `side` is the painted border width. Measured on the
 * cream centre — re-measure if the art is replaced.
 */
export const MURAL_SLICE = { top: 434, bottom: 322, side: 162 } as const;

/** The opening inside the sandstone arch, as % of the image: left, top, width, height. */
export const SANDSTONE_OPENING = { left: 10.9, top: 6.5, width: 79, height: 93.5 } as const;

/**
 * The carved jharokha (arch.webp, 900×1613) sliced as a border image to frame tall content: the
 * scalloped head above `top`, the plinths below `bottom`, and the fluted pillars (`side` wide)
 * repeat in between. Re-measure if the art is replaced.
 */
export const ARCH_SLICE = { top: 800, bottom: 403, side: 100 } as const;
