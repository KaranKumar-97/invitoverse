import { describe, expect, it } from "vitest";
import {
  addDays,
  alignEventsToWedding,
  countdownTarget,
  dateParts,
  daysBetween,
  formatLongDate,
  formatTime,
  formatTimeRange,
  toInstant,
} from "@/lib/invitation/dates";
import { buildIcs } from "@/lib/invitation/ics";
import { diffParts } from "@/invitation-kit/countdown/useCountdown";

describe("dates", () => {
  it("formats times in 12h", () => {
    expect(formatTime("00:05")).toBe("12:05 AM");
    expect(formatTime("12:00")).toBe("12:00 PM");
    expect(formatTime("18:30")).toBe("6:30 PM");
    expect(formatTimeRange("16:00", "20:00")).toBe("4:00 PM – 8:00 PM");
  });

  it("formats dates without timezone drift", () => {
    expect(formatLongDate("2027-02-13")).toBe("Saturday, 13 February 2027");
    expect(dateParts("2027-02-13")).toMatchObject({
      day: "13",
      month: "February",
      year: "2027",
      dayPadded: "13",
      monthNumber: "02",
    });
  });

  it("converts IST wall clock to an instant", () => {
    expect(toInstant("2027-02-13", "18:30", "Asia/Kolkata").toISOString()).toBe(
      "2027-02-13T13:00:00.000Z",
    );
  });

  it("computes countdown parts", () => {
    const now = Date.UTC(2027, 0, 1);
    expect(diffParts(now + ((2 * 24 + 3) * 3600 + 4 * 60 + 5) * 1000, now)).toEqual({
      days: 2,
      hours: 3,
      minutes: 4,
      seconds: 5,
      isPast: false,
    });
    expect(diffParts(now - 1000, now).isPast).toBe(true);
  });
});

describe("buildIcs", () => {
  it("produces a valid UTC VEVENT with escaped text", () => {
    const ics = buildIcs({
      timezone: "Asia/Kolkata",
      coupleTitle: "Meera & Aarav",
      event: {
        id: "evt_wedding003",
        name: "Wedding; Pheras",
        icon: "mandap",
        date: "2027-02-13",
        startTime: "18:30",
        venue: { name: "City Palace", address: "Udaipur, Rajasthan" },
      },
    });
    expect(ics).toContain("BEGIN:VCALENDAR\r\n");
    expect(ics).toContain("DTSTART:20270213T130000Z");
    expect(ics).toContain("DTEND:20270213T160000Z");
    expect(ics).toContain("SUMMARY:Wedding\\; Pheras · Meera & Aarav");
    expect(ics).toContain("LOCATION:City Palace\\, Udaipur\\, Rajasthan");
  });
});

describe("aligning sample events to the wedding date", () => {
  it("counts whole days and moves dates across months and years", () => {
    expect(daysBetween("2027-11-27", "2026-11-25")).toBe(-367);
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("keeps the spacing between events and skips undated ones", () => {
    const events = [
      { name: "Cocktail", date: "2027-11-26" },
      { name: "Wedding", date: "2027-11-27" },
      { name: "TBD", date: "" },
    ];
    expect(alignEventsToWedding(events, "2027-11-27", "2026-11-25")).toEqual([
      { name: "Cocktail", date: "2026-11-24" },
      { name: "Wedding", date: "2026-11-25" },
      { name: "TBD", date: "" },
    ]);
  });
});

describe("countdownTarget", () => {
  const ev = (date: string, startTime: string) =>
    ({ date, startTime }) as Parameters<typeof countdownTarget>[0]["events"][number];

  it("targets the wedding date, not an earlier or later event", () => {
    // The bug: sample events a year out made the countdown say 369 days.
    expect(
      countdownTarget({
        weddingDate: "2026-11-25",
        timezone: "Asia/Kolkata",
        events: [ev("2027-11-26", "19:30"), ev("2027-11-27", "17:00")],
      }),
    ).toBe("2026-11-24T18:30:00.000Z"); // 25 Nov 00:00 IST
  });

  it("uses the first event's time on the wedding day", () => {
    expect(
      countdownTarget({
        weddingDate: "2026-11-25",
        timezone: "Asia/Kolkata",
        events: [ev("2026-11-24", "19:00"), ev("2026-11-25", "20:00"), ev("2026-11-25", "17:00")],
      }),
    ).toBe("2026-11-25T11:30:00.000Z"); // 17:00 IST
  });
});
