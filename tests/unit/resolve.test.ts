import { describe, expect, it } from "vitest";
import { defaultDesign } from "@/lib/invitation/defaults";
import { assertValidManifest, optionsToZod } from "@/lib/invitation/manifest";
import { resolveRenderable } from "@/lib/invitation/resolve";
import { templateDemos, templateManifests } from "@/templates/registry";

const manifest = templateManifests["royal-heritage"];
const demo = templateDemos["royal-heritage"];
const resolve = (
  design = defaultDesign(manifest),
  guest: Parameters<typeof resolveRenderable>[0]["guest"] = null,
) => resolveRenderable({ manifest, content: demo.content, design, mode: "DEMO", key: "t", guest });

describe("resolveRenderable", () => {
  it("puts hero first and footer last, always includes events", () => {
    const design = defaultDesign(manifest);
    design.sections = [
      { key: "footer", visible: true },
      { key: "gallery", visible: true },
      { key: "hero", visible: false },
      { key: "events", visible: false },
    ];
    const r = resolve(design);
    expect(r.sections[0]).toBe("hero");
    expect(r.sections.at(-1)).toBe("footer");
    expect(r.sections).toContain("events");
    expect(r.sections).toContain("gallery");
  });

  it("drops hidden and empty sections", () => {
    const r = resolve();
    expect(r.sections).not.toContain("video"); // demo has no video
    const design = defaultDesign(manifest);
    design.sections = design.sections.map((s) =>
      s.key === "gallery" ? { ...s, visible: false } : s,
    );
    expect(resolve(design).sections).not.toContain("gallery");
  });

  it("filters events for SELECTED guests and exposes only display fields", () => {
    const r = resolve(undefined, {
      displayName: "Sharma Family",
      greeting: null,
      personalNote: null,
      eventAccess: "SELECTED",
      eventIds: demo.guestEventIds,
    });
    expect(r.content.events.map((e) => e.id).sort()).toEqual([...demo.guestEventIds].sort());
    expect(Object.keys(r.guest!).sort()).toEqual(["displayName", "greeting", "personalNote"]);
    expect(JSON.stringify(r)).not.toContain("eventAccess");
  });

  it("removes the events section when a guest is invited to nothing", () => {
    const r = resolve(undefined, {
      displayName: "X",
      greeting: null,
      personalNote: null,
      eventAccess: "SELECTED",
      eventIds: [],
    });
    expect(r.sections).not.toContain("events");
  });

  it("counts down to the guest's first visible event", () => {
    const all = resolve();
    const guest = resolve(undefined, {
      displayName: "X",
      greeting: null,
      personalNote: null,
      eventAccess: "SELECTED",
      eventIds: ["evt_reception4"],
    });
    expect(new Date(guest.countdownTo).getTime()).toBeGreaterThan(
      new Date(all.countdownTo).getTime(),
    );
    expect(guest.countdownTo).toBe("2027-02-14T14:30:00.000Z"); // 20:00 IST
  });

  it("applies only customizable palette overrides", () => {
    const design = defaultDesign(manifest);
    design.paletteOverrides = { accent: "#123456", surface: "#ABCDEF" };
    const r = resolve(design);
    expect(r.theme.colors.accent).toBe("#123456");
    expect(r.theme.colors.surface).toBe(manifest.palettes[0].colors.surface);
  });

  it("falls back for unknown palette, font and invalid options", () => {
    const design = {
      ...defaultDesign(manifest),
      paletteId: "nope",
      fontPairId: "nope",
      templateOptions: { sealStyle: "<script>", extra: 1 },
    };
    const r = resolve(design);
    expect(r.theme.paletteId).toBe(manifest.palettes[0].id);
    expect(r.theme.fontPairId).toBe(manifest.fontPairs[0].id);
    expect(r.options).toEqual({
      showMandalaBorder: true,
      sealStyle: "wax-gold",
      showInvocationArt: true,
    });
  });

  it("resolves library music", () => {
    expect(resolve().music).toMatchObject({ src: "/music/raag-dawn.m4a" });
  });
});

describe("manifests", () => {
  it("are all internally valid", () => {
    for (const m of Object.values(templateManifests))
      expect(() => assertValidManifest(m)).not.toThrow();
  });

  it("optionsToZod strips unknown keys and defaults missing ones", () => {
    expect(optionsToZod(manifest.options).parse({})).toEqual({
      showMandalaBorder: true,
      sealStyle: "wax-gold",
      showInvocationArt: true,
    });
  });
});
