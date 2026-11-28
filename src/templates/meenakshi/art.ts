/**
 * Painted scene art for Meenakshi (paths + natural sizes, so layouts can reserve space).
 * PLACEHOLDER: the files in /public/templates/meenakshi/art/ are reference art from a third-party
 * site. Replace them with project-owned art (same names, similar proportions). See CREDITS.md.
 */
// Served through /t-art so admins can replace art from the portal (docs/19 §4.6); the files live
// in /public/templates/meenakshi/art/.
const BASE = "/t-art/meenakshi";

export type ArtImage = { src: string; w: number; h: number };

const a = (file: string, w: number, h: number): ArtImage => ({ src: `${BASE}/${file}`, w, h });

export const ART = {
  gopuram: a("gopuram.webp", 2032, 3072),
  trees: a("trees.webp", 2032, 3072),
  ganesha: a("ganesha.webp", 512, 512),
  blessingArch: a("blessing-arch.webp", 2048, 3072),
  coupleArch: a("couple-arch.webp", 2048, 3072),
  eventArchA: a("event-arch-a.webp", 3008, 2080),
  eventArchB: a("event-arch-b.webp", 3008, 2080),
  courtyard: a("courtyard.webp", 1872, 3344),
  varmala: a("varmala.webp", 573, 1024),
  gildedFrame: a("gilded-frame.png", 1998, 1492),
  hills: a("hills.jpg", 895, 1600),
} as const;

/** The transparent window inside the gilded frame, as % of the frame box. */
export const FRAME_WINDOW = { left: 13.2, right: 15.1, top: 14.7, bottom: 16.2 } as const;
