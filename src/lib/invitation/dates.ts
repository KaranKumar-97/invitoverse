/**
 * Date helpers that are deterministic on server and client (no Date.now, no local timezone),
 * so formatted dates never cause hydration mismatches.
 */
import { fromZonedTime } from "date-fns-tz";
import type { InvitationContent, InvitationEvent } from "./schema";

function utcDate(isoDate: string) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

const fmt = (opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-IN", { ...opts, timeZone: "UTC" });

/** "Saturday, 13 February 2027" */
export function formatLongDate(isoDate: string): string {
  const d = utcDate(isoDate);
  return `${fmt({ weekday: "long" }).format(d)}, ${fmt({ day: "numeric" }).format(d)} ${fmt({ month: "long" }).format(d)} ${fmt({ year: "numeric" }).format(d)}`;
}

/** Parts for decorative date layouts. */
export function dateParts(isoDate: string) {
  const d = utcDate(isoDate);
  return {
    weekday: fmt({ weekday: "long" }).format(d),
    weekdayShort: fmt({ weekday: "short" }).format(d),
    day: fmt({ day: "numeric" }).format(d),
    dayPadded: isoDate.slice(8, 10),
    month: fmt({ month: "long" }).format(d),
    monthShort: fmt({ month: "short" }).format(d),
    monthNumber: isoDate.slice(5, 7),
    year: isoDate.slice(0, 4),
  };
}

/** "18:30" → "6:30 PM" */
export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function formatTimeRange(start: string, end?: string): string {
  return end ? `${formatTime(start)} – ${formatTime(end)}` : formatTime(start);
}

/** Wall-clock date/time in the invitation's timezone → absolute instant. */
export function toInstant(isoDate: string, hhmm: string, timezone: string): Date {
  return fromZonedTime(`${isoDate}T${hhmm}:00`, timezone);
}

export function sortEvents(events: readonly InvitationEvent[]): InvitationEvent[] {
  return [...events].sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
}

/** Countdown targets the first visible event, else the wedding date at midnight. */
export function countdownTarget(
  content: Pick<InvitationContent, "events" | "weddingDate" | "timezone">,
): string {
  const first = sortEvents(content.events)[0];
  return (
    first
      ? toInstant(first.date, first.startTime, content.timezone)
      : toInstant(content.weddingDate, "00:00", content.timezone)
  ).toISOString();
}
