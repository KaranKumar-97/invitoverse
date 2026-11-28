/**
 * Art for Deepotsav (paths + natural sizes, so layouts can reserve space).
 * PLACEHOLDER until confirmed project-owned — see CREDITS.md.
 */
const BASE = "/templates/deepotsav/art";

export type ArtImage = { src: string; w: number; h: number };

const a = (file: string, w: number, h: number): ArtImage => ({ src: `${BASE}/${file}`, w, h });

export const ART = {
  /** Temple on the river at night, every lamp unlit (the cover's first frame). */
  unlit: a("temple-unlit.webp", 1080, 1920),
  /** The same view with every diya and the temple lit (the lighting film's last frame, the hero). */
  lit: a("temple-lit.webp", 1080, 1920),
  /** The lit temple seen from the front, up its steps (greeting backdrop). */
  front: a("temple-front.webp", 1080, 1920),
  ganesha: a("ganesha.webp", 320, 320),
  scratchFoil: a("scratch-foil.webp", 720, 600),
  mehendi: a("mehendi.webp", 720, 960),
  eventHaldi: a("event-haldi.webp", 498, 500),
  eventSangeet: a("event-sangeet.webp", 498, 500),
  eventWedding: a("event-wedding.webp", 497, 500),
  eventReception: a("event-reception.webp", 640, 423),
  eventGeneric: a("event-generic.webp", 640, 423),
} as const;

/** The lighting film (720×1280, 9 s, silent): lamps catch along the ghats, then the temple. */
export const LIGHTING_FILM = {
  src: `${BASE}/lighting.mp4`,
  /** Seconds of the film that hold the lighting (before: still; after: fully lit). */
  from: 1.6,
  to: 8.4,
} as const;

/** The floating diya in the scene, as % of the 9:16 frame (left, top of the bowl). */
export const FLOATING_DIYA = { left: 19.6, top: 94.6 } as const;
