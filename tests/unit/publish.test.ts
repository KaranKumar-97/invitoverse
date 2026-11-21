import { describe, expect, it } from "vitest";
import { buildChecklist, canPublish } from "@/lib/invitation/checklist";
import { defaultDesign } from "@/lib/invitation/defaults";
import { toPublishable } from "@/lib/invitation/publishable";
import { DraftContentSchema, InvitationContentSchema } from "@/lib/invitation/schema";
import { invitationShareText, publicInvitationUrl, whatsappShareUrl } from "@/lib/share";
import { templateDemos, templateManifests } from "@/templates/registry";

const manifest = templateManifests["royal-heritage"];
const draft = () =>
  DraftContentSchema.parse(InvitationContentSchema.parse(templateDemos["royal-heritage"].content));
const check = (content = draft(), slug = "priya-rahul") =>
  buildChecklist({ content, design: defaultDesign(manifest), slug, templateAvailable: true });
const item = (items: ReturnType<typeof check>, key: string) => items.find((i) => i.key === key)!;

describe("toPublishable", () => {
  it("turns empty optional fields into undefined and passes strict validation", () => {
    const d = draft();
    d.city = "";
    d.events[0].endTime = "";
    d.events[0].venue.mapsUrl = "";
    const r = toPublishable(d);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.content.city).toBeUndefined();
      expect(r.content.events[0].endTime).toBeUndefined();
      expect(r.content.events[0].venue.mapsUrl).toBeUndefined();
    }
  });

  it("does not invent missing required values", () => {
    const d = draft();
    d.couple.groom.firstName = " ";
    expect(toPublishable(d).ok).toBe(false);
  });
});

describe("publish checklist", () => {
  it("passes for complete content", () => {
    const items = check();
    expect(canPublish(items)).toBe(true);
    expect(items.filter((i) => i.severity === "required").every((i) => i.ok)).toBe(true);
  });

  it("blocks on missing names, incomplete events, bad map links, bad slugs, unavailable designs", () => {
    const d = draft();
    d.couple.bride.firstName = "";
    expect(item(check(d), "names").ok).toBe(false);

    const e = draft();
    e.events[1].startTime = "";
    const items = check(e);
    expect(item(items, "events")).toMatchObject({ ok: false, fix: "events" });
    expect(item(items, "events").detail).toContain("Sangeet");

    const m = draft();
    m.events[0].venue.mapsUrl = "https://evil.example.com";
    expect(item(check(m), "mapsUrls").ok).toBe(false);

    expect(item(check(draft(), "admin"), "slug").ok).toBe(false);
    expect(
      canPublish(
        buildChecklist({
          content: draft(),
          design: defaultDesign(manifest),
          slug: "ok-slug",
          templateAvailable: false,
        }),
      ),
    ).toBe(false);

    const none = draft();
    none.events = [];
    expect(canPublish(check(none))).toBe(false);
  });

  it("only warns (doesn't block) about sample content and photos", () => {
    const d = draft();
    d.sample = ["events", "messages"];
    const items = check(d);
    expect(item(items, "sampleData").ok).toBe(false);
    expect(item(items, "welcome").ok).toBe(false);
    expect(item(items, "photos").ok).toBe(false); // demo photos
    expect(canPublish(items)).toBe(true);
  });
});

describe("share helpers", () => {
  it("builds public and WhatsApp URLs", () => {
    const url = publicInvitationUrl("https://invitationbanao.com/", "priya-rahul");
    expect(url).toBe("https://invitationbanao.com/i/priya-rahul");
    const wa = whatsappShareUrl(invitationShareText("Priya & Rahul", url));
    expect(wa.startsWith("https://wa.me/?text=")).toBe(true);
    expect(decodeURIComponent(wa.split("text=")[1])).toContain("Priya & Rahul are getting married");
    expect(whatsappShareUrl("hi", "+91 98765-43210")).toBe("https://wa.me/919876543210?text=hi");
  });
});
