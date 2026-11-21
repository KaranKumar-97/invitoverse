import { describe, expect, it } from "vitest";
import { coerceForPreview, sampleKeyForPath } from "@/lib/invitation/preview";
import { resolveRenderable } from "@/lib/invitation/resolve";
import { DraftContentSchema, InvitationContentSchema } from "@/lib/invitation/schema";
import { slugCandidates, slugify, slugProblem } from "@/lib/slug";
import { templateDemos, templateManifests } from "@/templates/registry";
import { defaultDesign } from "@/lib/invitation/defaults";

describe("slugs", () => {
  it("slugifies names, accents and ampersands", () => {
    expect(slugify("Priya & Rahul")).toBe("priya-and-rahul");
    expect(slugify("  Zoë  Ånand!! ")).toBe("zoe-anand");
    expect(slugify("a".repeat(80)).length).toBeLessThanOrEqual(48);
  });

  it.each([
    ["ab", "TOO_SHORT"],
    ["-priya", "INVALID"],
    ["priya--rahul", "INVALID"],
    ["Priya", "INVALID"],
    ["dashboard", "RESERVED"],
    ["priya-rahul", null],
  ])("slugProblem(%s) = %s", (slug, problem) => expect(slugProblem(slug)).toBe(problem));

  it("suggests natural candidates", () => {
    expect(slugCandidates("Priya", "Rahul", "2027-02-14")).toEqual([
      "priya-rahul",
      "priya-weds-rahul",
      "priya-and-rahul",
      "priya-rahul-2027",
      "priya-weds-rahul-2027",
      "priya-and-rahul-2027",
    ]);
  });
});

const draft = () =>
  DraftContentSchema.parse(InvitationContentSchema.parse(templateDemos["royal-heritage"].content));

describe("coerceForPreview", () => {
  it("fills placeholders for empty names and drops incomplete events", () => {
    const d = draft();
    d.couple.bride.firstName = "";
    d.events[0].date = "";
    d.events[1].venue.mapsUrl = "javascript:alert(1)";
    const c = coerceForPreview(d);
    expect(c.couple.bride.firstName).toBe("Bride");
    expect(c.events).toHaveLength(d.events.length - 1);
    expect(c.events.find((e) => e.id === d.events[1].id)?.venue.mapsUrl).toBeUndefined();
    expect(() => InvitationContentSchema.parse(c)).not.toThrow();
  });

  it("renders a draft with no events and no date", () => {
    const d = draft();
    d.events = [];
    d.weddingDate = "";
    const r = resolveRenderable({
      manifest: templateManifests["royal-heritage"],
      content: d,
      design: defaultDesign(templateManifests["royal-heritage"]),
      mode: "PREVIEW",
      key: "t",
    });
    expect(r.sections).not.toContain("events");
    expect(r.content.weddingDate).toBe("2030-01-01");
  });

  it("maps field paths to sample groups", () => {
    expect(sampleKeyForPath("events.2.venue.name")).toBe("events");
    expect(sampleKeyForPath("couple.bride.firstName")).toBe("couple");
    expect(sampleKeyForPath("city")).toBe("wedding");
    expect(sampleKeyForPath("sample")).toBeNull();
  });
});
