/**
 * Turns stored data (content + design) into exactly what a template renders.
 * docs/05-template-engine.md §8. Runs on the server: guest filtering happens here so
 * events a guest isn't invited to never reach the browser.
 */
import { findFontPair, findPalette, optionsToZod, type TemplateManifest } from "./manifest";
import { countdownTarget, sortEvents } from "./dates";
import { findTrack, type LibraryTrack } from "./music-library";
import { coerceForPreview } from "./preview";
import {
  DesignConfigSchema,
  DraftContentSchema,
  InvitationContentSchema,
  type DesignConfig,
  type InvitationContent,
  type PaletteKey,
  type SectionKey,
} from "./schema";

export type RenderMode = "PUBLIC" | "GUEST" | "PREVIEW" | "DEMO";

/** Only display fields — never tokens, notes, phone, event ids or status. */
export type GuestView = {
  displayName: string;
  greeting: string | null;
  personalNote: string | null;
};

export type GuestInput = GuestView & {
  eventAccess: "ALL" | "SELECTED";
  eventIds: readonly string[];
};

export type RenderableInvitation = {
  mode: RenderMode;
  /** Stable key for per-invitation browser state (e.g. "opened this session"). */
  key: string;
  templateSlug: string;
  content: InvitationContent;
  theme: {
    paletteId: string;
    colors: Record<PaletteKey, string>;
    fontPairId: string;
    background: { presetId: string | null; src: string | null };
  };
  sections: SectionKey[];
  animation: DesignConfig["animation"];
  options: Record<string, unknown>;
  guest: GuestView | null;
  music: { src: string; title: string; startAtSec: number } | null;
  countdownTo: string; // ISO instant
  /** Live invitations only: where to count opens and fetch calendar files. */
  links: { beacon: { slug: string; token?: string } | null; icsBase: string | null };
  durationMs: number; // opening sequence length for the chosen intensity
};

export { motionScale } from "./motion";

function hasData(key: SectionKey, c: InvitationContent): boolean {
  switch (key) {
    case "gallery":
      return c.media.gallery.length + c.media.familyPhotos.length > 0;
    case "video":
      return c.media.video !== null;
    case "couple":
      return (
        c.media.couplePhotos.length > 0 ||
        Boolean(c.couple.bride.shortBio || c.couple.groom.shortBio)
      );
    case "families":
      return c.families.bride.lines.length + c.families.groom.lines.length > 0;
    case "message":
      return Boolean(c.messages.invitation);
    case "events":
      return c.events.length > 0;
    default:
      return true;
  }
}

export function resolveRenderable(input: {
  manifest: TemplateManifest;
  content: unknown;
  design: unknown;
  mode: RenderMode;
  key: string;
  guest?: GuestInput | null;
  links?: Partial<RenderableInvitation["links"]>;
  /** The managed music library (src/server/services/music.ts); defaults to the bundled list. */
  library?: readonly LibraryTrack[];
}): RenderableInvitation {
  const { manifest, mode } = input;
  // Editor previews render drafts (possibly incomplete); everything else must be strictly valid.
  const parsed =
    mode === "PREVIEW"
      ? coerceForPreview(DraftContentSchema.parse(input.content))
      : InvitationContentSchema.parse(input.content);
  const design = DesignConfigSchema.parse(input.design);

  // Guest event filtering (server-side).
  const guest = input.guest ?? null;
  const events =
    guest?.eventAccess === "SELECTED"
      ? parsed.events.filter((e) => guest.eventIds.includes(e.id))
      : parsed.events;
  const content: InvitationContent = { ...parsed, events: sortEvents(events) };

  // Theme
  const palette = findPalette(manifest, design.paletteId);
  const overrides = Object.fromEntries(
    Object.entries(design.paletteOverrides).filter(([k]) =>
      manifest.customizablePaletteKeys.includes(k as PaletteKey),
    ),
  );
  const fontPair = findFontPair(manifest, design.fontPairId);
  const preset =
    design.background.type === "PRESET"
      ? (manifest.backgrounds.find(
          (b) => b.id === (design.background as { presetId: string }).presetId,
        ) ??
        manifest.backgrounds[0] ??
        null)
      : null;
  const background =
    design.background.type === "UPLOAD"
      ? { presetId: null, src: design.background.url }
      : { presetId: preset?.id ?? null, src: preset?.src ?? null };

  // Sections: visible + supported + has data; hero first, footer last, required ones always present.
  const supported = new Set(manifest.supportedSections);
  let sections = design.sections.filter((s) => s.visible && supported.has(s.key)).map((s) => s.key);
  sections = sections.filter((k) => k !== "hero" && k !== "footer");
  if (!sections.includes("events")) sections.push("events");
  sections = ["hero", ...sections, "footer"];
  sections = sections.filter((k) => hasData(k, content));

  // Music
  const m = content.media.music;
  const track = m?.type === "LIBRARY" ? findTrack(m.trackId, input.library) : undefined;
  const music = m
    ? m.type === "LIBRARY"
      ? track
        ? { src: track.src, title: track.title, startAtSec: m.startAtSec }
        : null
      : { src: m.url, title: m.title ?? "Our song", startAtSec: m.startAtSec }
    : null;

  return {
    mode,
    key: input.key,
    templateSlug: manifest.slug,
    content,
    theme: {
      paletteId: palette.id,
      colors: { ...palette.colors, ...overrides },
      fontPairId: fontPair.id,
      background,
    },
    sections,
    animation: design.animation,
    options: optionsToZod(manifest.options).parse(design.templateOptions),
    guest: guest
      ? {
          displayName: guest.displayName,
          greeting: guest.greeting,
          personalNote: guest.personalNote,
        }
      : null,
    music,
    countdownTo: countdownTarget(content),
    links: { beacon: input.links?.beacon ?? null, icsBase: input.links?.icsBase ?? null },
    durationMs: manifest.animation.durationsMs[design.animation.intensity],
  };
}
