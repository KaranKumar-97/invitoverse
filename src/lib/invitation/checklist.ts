/**
 * Publish checklist (docs/06-publishing-workflow.md §3). Pure and isomorphic: the editor shows it
 * live; the server re-runs it (plus entitlement checks) inside publish.
 */
import { slugProblem, SLUG_PROBLEM_MESSAGES } from "@/lib/slug";
import { toPublishable } from "./publishable";
import type { DesignConfig, DraftContent } from "./schema";
import { isAllowedMapsUrl } from "./urls";

export type ChecklistTab = "details" | "events" | "media" | "design" | "settings";
export type ChecklistItem = {
  key: string;
  label: string;
  ok: boolean;
  severity: "required" | "recommended";
  detail?: string;
  fix: ChecklistTab;
};

export function buildChecklist(input: {
  content: DraftContent;
  design: DesignConfig;
  slug: string;
  templateAvailable: boolean;
}): ChecklistItem[] {
  const { content: c, design } = input;
  const items: ChecklistItem[] = [];
  const add = (i: ChecklistItem) => items.push(i);

  add({
    key: "names",
    label: "Bride and groom names",
    ok: Boolean(c.couple.bride.firstName.trim() && c.couple.groom.firstName.trim()),
    severity: "required",
    fix: "details",
  });
  add({
    key: "date",
    label: "Wedding date",
    ok: /^\d{4}-\d{2}-\d{2}$/.test(c.weddingDate),
    severity: "required",
    fix: "details",
  });

  const incomplete = c.events.filter(
    (e) => !e.name.trim() || !e.date || !e.startTime || !e.venue.name.trim(),
  );
  add({
    key: "events",
    label: c.events.length ? "Every event has a name, date, time and venue" : "At least one event",
    ok: c.events.length > 0 && incomplete.length === 0,
    detail: incomplete.length
      ? `Incomplete: ${incomplete.map((e) => e.name.trim() || "Untitled event").join(", ")}`
      : undefined,
    severity: "required",
    fix: "events",
  });

  const badMaps = c.events.filter((e) => e.venue.mapsUrl && !isAllowedMapsUrl(e.venue.mapsUrl));
  add({
    key: "mapsUrls",
    label: "Map links are Google Maps links",
    ok: badMaps.length === 0,
    detail: badMaps.length
      ? `Check: ${badMaps.map((e) => e.name || "Untitled event").join(", ")}`
      : undefined,
    severity: "required",
    fix: "events",
  });

  const sp = slugProblem(input.slug);
  add({
    key: "slug",
    label: "Invitation link",
    ok: !sp,
    detail: sp ? SLUG_PROBLEM_MESSAGES[sp] : undefined,
    severity: "required",
    fix: "settings",
  });
  add({
    key: "template",
    label: "Design is available",
    ok: input.templateAvailable,
    severity: "required",
    fix: "design",
  });

  // Anything else the strict schema still rejects (only meaningful once the basics pass).
  const basicsOk = items.every((i) => i.ok);
  if (basicsOk) {
    const strict = toPublishable(c);
    add({
      key: "strictSchema",
      label: "All details are valid",
      ok: strict.ok,
      detail: strict.ok
        ? undefined
        : strict.issues[0]
          ? `${strict.issues[0].path}: ${strict.issues[0].message}`
          : undefined,
      severity: "required",
      fix: "details",
    });
  }

  add({
    key: "welcome",
    label: "Welcome message written by you",
    ok: Boolean(c.messages.welcome.trim()) && !c.sample.includes("messages"),
    severity: "recommended",
    fix: "details",
  });
  const sampleGroups = c.sample.filter(
    (s) => s === "events" || s === "families" || s === "wedding",
  );
  add({
    key: "sampleData",
    label: "Sample text replaced",
    ok: sampleGroups.length === 0,
    detail: sampleGroups.length ? `Still sample: ${sampleGroups.join(", ")}` : undefined,
    severity: "recommended",
    fix: sampleGroups[0] === "events" ? "events" : "details",
  });
  const samplePhotos = [
    ...c.media.couplePhotos,
    ...c.media.gallery,
    ...c.media.familyPhotos,
  ].filter((m) => m.assetId.startsWith("demo-")).length;
  add({
    key: "photos",
    label: "Your own photos",
    ok: samplePhotos === 0,
    detail: samplePhotos
      ? `${samplePhotos} sample photo${samplePhotos > 1 ? "s" : ""} still in use`
      : undefined,
    severity: "recommended",
    fix: "media",
  });
  add({
    key: "music",
    label: "Music chosen",
    ok: !design.animation.autoplayMusic || c.media.music !== null,
    severity: "recommended",
    fix: "media",
  });

  return items;
}

export const canPublish = (items: ChecklistItem[]) =>
  items.every((i) => i.severity !== "required" || i.ok);
