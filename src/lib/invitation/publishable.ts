/**
 * Draft → strict content for publishing. Unlike the preview coercion, nothing is invented:
 * empty optional fields become undefined, and anything still missing fails the strict schema.
 */
import { InvitationContentSchema, type DraftContent, type InvitationContent } from "./schema";

const opt = (s: string | undefined) => (s && s.trim() ? s.trim() : undefined);
const lines = (xs: string[]) => xs.map((x) => x.trim()).filter(Boolean);

export function toPublishable(
  draft: DraftContent,
):
  | { ok: true; content: InvitationContent }
  | { ok: false; issues: Array<{ path: string; message: string }> } {
  const candidate = {
    schemaVersion: 1 as const,
    couple: {
      order: draft.couple.order,
      bride: {
        firstName: draft.couple.bride.firstName.trim(),
        lastName: opt(draft.couple.bride.lastName),
        shortBio: opt(draft.couple.bride.shortBio),
      },
      groom: {
        firstName: draft.couple.groom.firstName.trim(),
        lastName: opt(draft.couple.groom.lastName),
        shortBio: opt(draft.couple.groom.shortBio),
      },
      monogram: opt(draft.couple.monogram),
    },
    families: {
      bride: {
        label: draft.families.bride.label.trim(),
        lines: lines(draft.families.bride.lines),
        grandparents: lines(draft.families.bride.grandparents),
      },
      groom: {
        label: draft.families.groom.label.trim(),
        lines: lines(draft.families.groom.lines),
        grandparents: lines(draft.families.groom.grandparents),
      },
    },
    invocation: opt(draft.invocation),
    weddingDate: draft.weddingDate,
    timezone: draft.timezone || "Asia/Kolkata",
    city: opt(draft.city),
    hashtag: opt(draft.hashtag),
    messages: {
      welcome: draft.messages.welcome.trim(),
      invitation: opt(draft.messages.invitation),
      closing: opt(draft.messages.closing),
    },
    events: draft.events.map((e) => ({
      id: e.id,
      name: e.name.trim(),
      icon: e.icon,
      date: e.date,
      startTime: e.startTime,
      endTime: e.endTime || undefined,
      venue: {
        name: e.venue.name.trim(),
        address: e.venue.address.trim(),
        mapsUrl: opt(e.venue.mapsUrl),
      },
      description: opt(e.description),
      dressCode: opt(e.dressCode),
    })),
    media: draft.media,
    sample: draft.sample,
  };
  const parsed = InvitationContentSchema.safeParse(candidate);
  if (parsed.success) return { ok: true, content: parsed.data };
  return {
    ok: false,
    issues: parsed.error.issues.map((i) => ({
      path: i.path.map(String).join("."),
      message: i.message,
    })),
  };
}
