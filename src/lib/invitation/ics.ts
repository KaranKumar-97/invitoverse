/** Minimal RFC 5545 calendar file for one event (used client-side now, by /api/v1/ics later). */
import { toInstant } from "./dates";
import type { InvitationEvent } from "./schema";
import { BRAND } from "@/lib/brand";

const escape = (s: string) =>
  s
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/([,;])/g, "\\$1");
const stamp = (d: Date) =>
  d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

/** Fold lines longer than 75 octets (approximated by characters). */
function fold(line: string) {
  const out: string[] = [];
  for (let i = 0; i < line.length; i += 73) out.push((i ? " " : "") + line.slice(i, i + 73));
  return out.join("\r\n");
}

export function buildIcs(input: {
  event: InvitationEvent;
  timezone: string;
  coupleTitle: string; // "Meera & Aarav"
  uidDomain?: string;
  url?: string;
}): string {
  const { event, timezone } = input;
  const start = toInstant(event.date, event.startTime, timezone);
  const end = event.endTime
    ? toInstant(event.date, event.endTime, timezone)
    : new Date(start.getTime() + 3 * 60 * 60 * 1000);
  const location = [event.venue.name, event.venue.address].filter(Boolean).join(", ");
  const description = [
    event.description,
    event.dressCode ? `Dress code: ${event.dressCode}` : "",
    event.venue.mapsUrl ?? "",
    input.url ?? "",
  ]
    .filter(Boolean)
    .join("\n");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${BRAND.name}//Invitation//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.id}@${input.uidDomain ?? "digital-invites"}`,
    `DTSTAMP:${stamp(start)}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escape(`${event.name} · ${input.coupleTitle}`)}`,
    `LOCATION:${escape(location)}`,
    `DESCRIPTION:${escape(description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}
