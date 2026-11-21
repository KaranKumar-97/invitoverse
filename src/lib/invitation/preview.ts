/**
 * Turns a possibly-incomplete draft into strict content that templates can render
 * (editor live preview). Never throws: missing values get gentle placeholders and invalid
 * links/events are dropped rather than rendered.
 */
import {
  EventSchema,
  InvitationContentSchema,
  MediaRefSchema,
  type DraftContent,
  type InvitationContent,
  type InvitationEvent,
} from "./schema";
import { isAllowedMapsUrl } from "./urls";

const PLACEHOLDER_DATE = "2030-01-01";
const nonEmpty = (s: string | undefined) => (s && s.trim() ? s.trim() : undefined);

export function coerceForPreview(draft: DraftContent): InvitationContent {
  const events: InvitationEvent[] = [];
  for (const e of draft.events) {
    if (!e.date || !e.startTime) continue;
    const candidate = {
      id: e.id,
      name: nonEmpty(e.name) ?? "Untitled event",
      icon: e.icon,
      date: e.date,
      startTime: e.startTime,
      endTime: e.endTime || undefined,
      venue: {
        name: nonEmpty(e.venue.name) ?? "Venue to be announced",
        address: e.venue.address,
        mapsUrl: e.venue.mapsUrl && isAllowedMapsUrl(e.venue.mapsUrl) ? e.venue.mapsUrl : undefined,
      },
      description: nonEmpty(e.description),
      dressCode: nonEmpty(e.dressCode),
    };
    const parsed = EventSchema.safeParse(candidate);
    if (parsed.success) events.push(parsed.data);
  }

  const weddingDate = draft.weddingDate || events[0]?.date || PLACEHOLDER_DATE;
  const cleanLines = (xs: string[]) => xs.map((x) => x.trim()).filter(Boolean);

  const content = {
    schemaVersion: 1 as const,
    couple: {
      order: draft.couple.order,
      bride: {
        firstName: nonEmpty(draft.couple.bride.firstName) ?? "Bride",
        lastName: nonEmpty(draft.couple.bride.lastName),
        shortBio: nonEmpty(draft.couple.bride.shortBio),
      },
      groom: {
        firstName: nonEmpty(draft.couple.groom.firstName) ?? "Groom",
        lastName: nonEmpty(draft.couple.groom.lastName),
        shortBio: nonEmpty(draft.couple.groom.shortBio),
      },
      monogram: nonEmpty(draft.couple.monogram),
    },
    families: {
      bride: {
        label: draft.families.bride.label,
        lines: cleanLines(draft.families.bride.lines),
        grandparents: cleanLines(draft.families.bride.grandparents),
      },
      groom: {
        label: draft.families.groom.label,
        lines: cleanLines(draft.families.groom.lines),
        grandparents: cleanLines(draft.families.groom.grandparents),
      },
    },
    invocation: nonEmpty(draft.invocation),
    weddingDate,
    timezone: draft.timezone || "Asia/Kolkata",
    city: nonEmpty(draft.city),
    hashtag: nonEmpty(draft.hashtag),
    messages: {
      welcome: draft.messages.welcome,
      invitation: nonEmpty(draft.messages.invitation),
      closing: nonEmpty(draft.messages.closing),
    },
    // Templates need at least one event; the resolver hides the section when it's a placeholder.
    events,
    media: {
      ...draft.media,
      couplePhotos: draft.media.couplePhotos.filter((m) => MediaRefSchema.safeParse(m).success),
      familyPhotos: draft.media.familyPhotos.filter((m) => MediaRefSchema.safeParse(m).success),
      gallery: draft.media.gallery.filter((m) => MediaRefSchema.safeParse(m).success),
    },
    sample: draft.sample,
  };

  // The strict schema requires ≥1 event; previews of event-less drafts get a hidden stand-in.
  if (content.events.length === 0) {
    const parsed = InvitationContentSchema.safeParse({
      ...content,
      events: [PLACEHOLDER_EVENT(weddingDate)],
    });
    if (parsed.success) return { ...parsed.data, events: [] };
  }
  const parsed = InvitationContentSchema.safeParse(content);
  if (parsed.success) return parsed.data;
  // Last resort: render names + date only.
  return InvitationContentSchema.parse({
    ...content,
    families: undefined,
    events: [PLACEHOLDER_EVENT(weddingDate)],
    media: undefined,
    invocation: undefined,
    hashtag: undefined,
    city: undefined,
  });
}

const PLACEHOLDER_EVENT = (date: string) => ({
  id: "evt_placeholdr",
  name: "Wedding",
  icon: "rings" as const,
  date,
  startTime: "18:00",
  venue: { name: "Venue to be announced", address: "" },
});

/** Map an editor field path to the sample group it belongs to. */
export function sampleKeyForPath(path: string): DraftContent["sample"][number] | null {
  if (path.startsWith("couple")) return "couple";
  if (path.startsWith("families")) return "families";
  if (path.startsWith("messages")) return "messages";
  if (path.startsWith("events")) return "events";
  if (path.startsWith("media")) return "media";
  if (/^(weddingDate|timezone|city|hashtag|invocation)/.test(path)) return "wedding";
  return null;
}
