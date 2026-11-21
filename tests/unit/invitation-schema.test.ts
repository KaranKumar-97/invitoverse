import { describe, expect, it } from "vitest";
import { DesignConfigSchema, InvitationContentSchema } from "@/lib/invitation/schema";
import { isAllowedMapsUrl, isAllowedMediaUrl } from "@/lib/invitation/urls";
import { templateDemos } from "@/templates/registry";

const base = structuredClone(templateDemos["royal-heritage"].content);

describe("InvitationContentSchema", () => {
  it("accepts every registered template's demo content", () => {
    for (const demo of Object.values(templateDemos))
      expect(() => InvitationContentSchema.parse(demo.content)).not.toThrow();
  });

  it("requires at least one event", () => {
    expect(InvitationContentSchema.safeParse({ ...base, events: [] }).success).toBe(false);
  });

  it("rejects duplicate event ids", () => {
    const e = base.events[0];
    expect(InvitationContentSchema.safeParse({ ...base, events: [e, e] }).success).toBe(false);
  });

  it("rejects non-Google maps links and javascript: URLs", () => {
    const withMaps = (mapsUrl: string) => ({
      ...base,
      events: [{ ...base.events[0], venue: { ...base.events[0].venue, mapsUrl } }],
    });
    expect(InvitationContentSchema.safeParse(withMaps("javascript:alert(1)")).success).toBe(false);
    expect(
      InvitationContentSchema.safeParse(withMaps("https://evil.example.com/maps")).success,
    ).toBe(false);
    expect(
      InvitationContentSchema.safeParse(withMaps("https://maps.app.goo.gl/abc123")).success,
    ).toBe(true);
  });

  it("rejects media hosted outside the platform", () => {
    const media = {
      ...base.media,
      gallery: [
        { assetId: "x", url: "https://tracker.example.com/pixel.png", width: 1, height: 1 },
      ],
    };
    expect(InvitationContentSchema.safeParse({ ...base, media }).success).toBe(false);
  });

  it("fills defaults for optional blocks", () => {
    const minimal = {
      schemaVersion: 1,
      couple: { bride: { firstName: "A" }, groom: { firstName: "B" } },
      weddingDate: "2027-01-01",
      messages: {},
      events: base.events.slice(0, 1),
    };
    const parsed = InvitationContentSchema.parse(minimal);
    expect(parsed.timezone).toBe("Asia/Kolkata");
    expect(parsed.media.gallery).toEqual([]);
    expect(parsed.couple.order).toBe("BRIDE_FIRST");
  });
});

describe("DesignConfigSchema", () => {
  it("rejects non-hex colour overrides (no CSS injection)", () => {
    const d = {
      paletteId: "x",
      fontPairId: "y",
      sections: [],
      paletteOverrides: { accent: "red;}body{display:none" },
    };
    expect(DesignConfigSchema.safeParse(d).success).toBe(false);
  });
});

describe("URL allow-lists", () => {
  it.each([
    ["https://www.google.com/maps/search/?api=1&query=x", true],
    ["https://maps.google.com/?q=x", true],
    ["https://goo.gl/maps/abc", true],
    ["https://goo.gl/abc", false],
    ["http://maps.app.goo.gl/abc", false],
    ["https://www.google.com/search?q=x", false],
  ])("maps %s → %s", (url, ok) => expect(isAllowedMapsUrl(url)).toBe(ok));

  it.each([
    ["/templates/royal-heritage/demo/couple.svg", true],
    ["/templates/../../etc/passwd", false],
    ["https://res.cloudinary.com/demo/image/upload/a.jpg", true],
    ["https://example.com/a.jpg", false],
  ])("media %s → %s", (url, ok) => expect(isAllowedMediaUrl(url)).toBe(ok));
});
