/**
 * Shared invitation data model — the single source of truth for every template.
 * docs/05-template-engine.md §4–5. Templates never define their own data shape.
 */
import { z } from "@/lib/zod";
import { isAllowedMapsUrl, isAllowedMediaUrl, YOUTUBE_ID } from "./urls";

// ───────────── Primitives ─────────────

export const SECTION_KEYS = [
  "hero",
  "greeting",
  "couple",
  "families",
  "countdown",
  "events",
  "gallery",
  "video",
  "message",
  "footer",
] as const;
export const SectionKeySchema = z.enum(SECTION_KEYS);
export type SectionKey = z.infer<typeof SectionKeySchema>;

export const PALETTE_KEYS = ["bg", "surface", "text", "muted", "accent", "accentContrast"] as const;
export const PaletteKeySchema = z.enum(PALETTE_KEYS);
export type PaletteKey = z.infer<typeof PaletteKeySchema>;

export const HexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit hex colour");
export const IsoDate = z.iso.date();
export const TimeOfDay = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM (24h)");

export const EVENT_ICONS = [
  "rings",
  "haldi",
  "mehndi",
  "music",
  "mandap",
  "cocktail",
  "reception",
  "puja",
  "baraat",
  "generic",
] as const;
export const EventIconSchema = z.enum(EVENT_ICONS);
export type EventIcon = z.infer<typeof EventIconSchema>;

const MediaUrl = z
  .string()
  .min(1)
  .refine(isAllowedMediaUrl, "Media must be uploaded in the editor");

export const MediaRefSchema = z.object({
  assetId: z.string().min(1),
  url: MediaUrl,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  alt: z.string().max(200).default(""),
  focal: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }).optional(),
  blurDataUrl: z.string().startsWith("data:image/").max(4000).optional(),
});
export type MediaRef = z.infer<typeof MediaRefSchema>;

export const VideoRefSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("UPLOAD"),
    assetId: z.string().min(1),
    url: MediaUrl,
    posterUrl: MediaUrl.optional(),
  }),
  z.object({ type: z.literal("YOUTUBE"), youtubeId: z.string().regex(YOUTUBE_ID) }),
]);
export type VideoRef = z.infer<typeof VideoRefSchema>;

export const MusicRefSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("LIBRARY"),
    trackId: z.string().min(1),
    startAtSec: z.number().min(0).max(600).default(0),
  }),
  z.object({
    type: z.literal("UPLOAD"),
    assetId: z.string().min(1),
    url: MediaUrl,
    title: z.string().max(80).optional(),
    startAtSec: z.number().min(0).max(600).default(0),
  }),
]);
export type MusicRef = z.infer<typeof MusicRefSchema>;

// ───────────── Content ─────────────
/** Groups that still contain template sample data (cleared as the owner edits them). */
export const SAMPLE_KEYS = [
  "couple",
  "families",
  "wedding",
  "messages",
  "events",
  "media",
] as const;
export const SampleKeySchema = z.enum(SAMPLE_KEYS);
export type SampleKey = z.infer<typeof SampleKeySchema>;

export const PersonSchema = z.object({
  firstName: z.string().trim().min(1, "Required").max(40),
  lastName: z.string().trim().max(40).optional(),
  shortBio: z.string().trim().max(200).optional(),
});

export const FamilyBlockSchema = z.object({
  label: z.string().trim().max(40).default(""),
  lines: z.array(z.string().trim().min(1).max(120)).max(4).default([]),
  grandparents: z.array(z.string().trim().min(1).max(120)).max(4).default([]),
});

export const VenueSchema = z.object({
  name: z.string().trim().min(1, "Required").max(120),
  address: z.string().trim().max(300).default(""),
  mapsUrl: z.string().trim().refine(isAllowedMapsUrl, "Must be a Google Maps link").optional(),
});

export const EventSchema = z.object({
  id: z.string().regex(/^evt_[a-z0-9]{10}$/),
  name: z.string().trim().min(1, "Required").max(60),
  icon: EventIconSchema.default("generic"),
  date: IsoDate,
  startTime: TimeOfDay,
  endTime: TimeOfDay.optional(),
  venue: VenueSchema,
  description: z.string().trim().max(500).optional(),
  dressCode: z.string().trim().max(80).optional(),
});
export type InvitationEvent = z.infer<typeof EventSchema>;

export const InvitationContentSchema = z.object({
  schemaVersion: z.literal(1),
  couple: z.object({
    order: z.enum(["BRIDE_FIRST", "GROOM_FIRST"]).default("BRIDE_FIRST"),
    bride: PersonSchema,
    groom: PersonSchema,
    monogram: z.string().trim().max(4).optional(),
  }),
  families: z.object({ bride: FamilyBlockSchema, groom: FamilyBlockSchema }).default({
    bride: { label: "", lines: [], grandparents: [] },
    groom: { label: "", lines: [], grandparents: [] },
  }),
  invocation: z.string().trim().max(120).optional(),
  weddingDate: IsoDate,
  timezone: z.string().default("Asia/Kolkata"),
  city: z.string().trim().max(80).optional(),
  hashtag: z.string().trim().max(40).optional(),
  messages: z.object({
    welcome: z.string().trim().max(400).default(""),
    invitation: z.string().trim().max(1500).optional(),
    closing: z.string().trim().max(200).optional(),
  }),
  events: z
    .array(EventSchema)
    .min(1, "Add at least one event")
    .max(15)
    .refine((evts) => new Set(evts.map((e) => e.id)).size === evts.length, "Duplicate event ids"),
  media: z
    .object({
      couplePhotos: z.array(MediaRefSchema).max(3).default([]),
      familyPhotos: z.array(MediaRefSchema).max(10).default([]),
      gallery: z.array(MediaRefSchema).max(30).default([]),
      video: VideoRefSchema.nullable().default(null),
      music: MusicRefSchema.nullable().default(null),
    })
    .default({ couplePhotos: [], familyPhotos: [], gallery: [], video: null, music: null }),
  sample: z.array(SampleKeySchema).default([]),
});
export type InvitationContent = z.infer<typeof InvitationContentSchema>;

export type InvitationContentInput = z.input<typeof InvitationContentSchema>;

// ───────────── Draft (lenient) ─────────────
// Drafts are saved on every keystroke, so values may be incomplete or temporarily invalid
// (empty names, half-typed map links). The *shape* is still enforced; publishing uses the strict
// schema above. Invalid values never render as links: see coerceForPreview().

const loose = (max: number) => z.string().max(max).default("");
const DateOrEmpty = z.union([IsoDate, z.literal("")]).default("");
const TimeOrEmpty = z.union([TimeOfDay, z.literal("")]).default("");

export const DraftEventSchema = z.object({
  id: z.string().regex(/^evt_[a-z0-9]{10}$/),
  name: loose(60),
  icon: EventIconSchema.default("generic"),
  date: DateOrEmpty,
  startTime: TimeOrEmpty,
  endTime: TimeOrEmpty,
  venue: z
    .object({ name: loose(120), address: loose(300), mapsUrl: loose(500) })
    .default({ name: "", address: "", mapsUrl: "" }),
  description: loose(500),
  dressCode: loose(80),
});
export type DraftEvent = z.infer<typeof DraftEventSchema>;

const DraftPerson = z.object({ firstName: loose(40), lastName: loose(40), shortBio: loose(200) });
const DraftFamily = z.object({
  label: loose(40),
  lines: z.array(z.string().max(120)).max(4).default([]),
  grandparents: z.array(z.string().max(120)).max(4).default([]),
});
const emptyFamily = { label: "", lines: [], grandparents: [] };

export const DraftContentSchema = z.object({
  schemaVersion: z.literal(1),
  couple: z.object({
    order: z.enum(["BRIDE_FIRST", "GROOM_FIRST"]).default("BRIDE_FIRST"),
    bride: DraftPerson,
    groom: DraftPerson,
    monogram: loose(4),
  }),
  families: z
    .object({ bride: DraftFamily, groom: DraftFamily })
    .default({ bride: emptyFamily, groom: emptyFamily }),
  invocation: loose(120),
  weddingDate: DateOrEmpty,
  timezone: z.string().max(64).default("Asia/Kolkata"),
  city: loose(80),
  hashtag: loose(40),
  messages: z.object({ welcome: loose(400), invitation: loose(1500), closing: loose(200) }),
  events: z
    .array(DraftEventSchema)
    .max(15)
    .refine((evts) => new Set(evts.map((e) => e.id)).size === evts.length, "Duplicate event ids"),
  media: z
    .object({
      couplePhotos: z.array(MediaRefSchema).max(3).default([]),
      familyPhotos: z.array(MediaRefSchema).max(10).default([]),
      gallery: z.array(MediaRefSchema).max(30).default([]),
      video: VideoRefSchema.nullable().default(null),
      music: MusicRefSchema.nullable().default(null),
    })
    .default({ couplePhotos: [], familyPhotos: [], gallery: [], video: null, music: null }),
  sample: z.array(SampleKeySchema).default([]),
});
export type DraftContent = z.infer<typeof DraftContentSchema>;

// ───────────── Design ─────────────

export const INTENSITIES = ["SUBTLE", "STANDARD", "DRAMATIC"] as const;
export const IntensitySchema = z.enum(INTENSITIES);
export type Intensity = z.infer<typeof IntensitySchema>;

export const DesignConfigSchema = z.object({
  paletteId: z.string().min(1),
  paletteOverrides: z.partialRecord(PaletteKeySchema, HexColor).default({}),
  fontPairId: z.string().min(1),
  background: z
    .discriminatedUnion("type", [
      z.object({ type: z.literal("PRESET"), presetId: z.string().min(1) }),
      z.object({ type: z.literal("UPLOAD"), assetId: z.string().min(1), url: MediaUrl }),
      z.object({ type: z.literal("NONE") }),
    ])
    .default({ type: "NONE" }),
  sections: z
    .array(z.object({ key: SectionKeySchema, visible: z.boolean() }))
    .max(SECTION_KEYS.length)
    .refine((s) => new Set(s.map((x) => x.key)).size === s.length, "Duplicate sections"),
  animation: z
    .object({
      intensity: IntensitySchema.default("STANDARD"),
      envelope: z.boolean().default(true),
      particles: z.boolean().default(true),
      autoplayMusic: z.boolean().default(true),
    })
    .default({ intensity: "STANDARD", envelope: true, particles: true, autoplayMusic: true }),
  templateOptions: z.record(z.string(), z.unknown()).default({}),
});
export type DesignConfig = z.infer<typeof DesignConfigSchema>;
export type DesignConfigInput = z.input<typeof DesignConfigSchema>;
