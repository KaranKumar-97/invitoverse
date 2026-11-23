import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ContactSchema, MIN_FILL_MS } from "@/lib/contact";
import { CATALOGUE, CATEGORIES, relatedTemplates } from "@/lib/marketing/catalogue";
import { TEMPLATE_SLUGS } from "@/templates/registry";

const sendEmail = vi.fn<(msg: unknown) => Promise<void>>();
vi.mock("@/server/integrations/email", () => ({ sendEmail: (m: unknown) => sendEmail(m) }));

const valid = {
  name: "Priya",
  reply: "priya@example.com",
  message: "We'd love a custom colour for our Sangeet.",
  website: "",
  elapsedMs: 9000,
};

describe("ContactSchema", () => {
  it("accepts an email or a phone number as the reply address", () => {
    expect(ContactSchema.safeParse(valid).success).toBe(true);
    expect(ContactSchema.safeParse({ ...valid, reply: "+91 98765 43210" }).success).toBe(true);
  });

  it("rejects junk reply addresses, short messages and oversized input", () => {
    expect(ContactSchema.safeParse({ ...valid, reply: "not-a-contact" }).success).toBe(false);
    expect(ContactSchema.safeParse({ ...valid, message: "hi" }).success).toBe(false);
    expect(ContactSchema.safeParse({ ...valid, message: "x".repeat(2001) }).success).toBe(false);
    expect(ContactSchema.safeParse({ ...valid, name: "" }).success).toBe(false);
  });
});

describe("submitContact", () => {
  beforeEach(() => sendEmail.mockReset().mockResolvedValue());

  it("delivers a real enquiry with reply-to set for email addresses", async () => {
    const { submitContact } = await import("@/server/services/contact");
    await expect(submitContact(valid)).resolves.toBe("sent");
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ replyTo: "priya@example.com", subject: "New enquiry from Priya" }),
    );
  });

  it("silently drops honeypot and too-fast submissions", async () => {
    const { submitContact } = await import("@/server/services/contact");
    await expect(submitContact({ ...valid, website: "http://spam" })).resolves.toBe("dropped");
    await expect(submitContact({ ...valid, elapsedMs: MIN_FILL_MS - 1 })).resolves.toBe("dropped");
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("returns field errors for invalid input", async () => {
    const { submitContact } = await import("@/server/services/contact");
    await expect(submitContact({ ...valid, reply: "x" })).rejects.toMatchObject({
      code: "VALIDATION",
      fieldErrors: { reply: expect.any(Array) },
    });
  });

  it("reports a delivery failure without leaking provider details", async () => {
    sendEmail.mockRejectedValueOnce(new Error("Resend responded 500"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { submitContact } = await import("@/server/services/contact");
    await expect(submitContact(valid)).rejects.toMatchObject({
      code: "INTERNAL",
      message: expect.not.stringContaining("Resend"),
    });
  });
});

describe("marketing catalogue", () => {
  it("lists every registered template in registry order", () => {
    expect(CATALOGUE.map((t) => t.slug)).toEqual(TEMPLATE_SLUGS);
  });

  it.each(TEMPLATE_SLUGS)(
    "%s has captured marketing media (run scripts/capture-template-media.mjs)",
    (slug) => {
      for (const file of ["poster.jpg", "og.jpg", "loop.mp4", "loop.webm"]) {
        const p = path.join("public/templates", slug, file);
        expect(existsSync(p), p).toBe(true);
        // Loops must stay light enough for catalogue cards (docs/15 Phase 6: ≤ 600 KB).
        if (file.startsWith("loop")) expect(statSync(p).size).toBeLessThan(600 * 1024);
      }
    },
  );

  it("maps every category to a URL param", () => {
    expect(new Set(CATEGORIES.map((c) => c.param)).size).toBe(CATEGORIES.length);
  });

  it("never recommends the template you're looking at", () => {
    for (const slug of TEMPLATE_SLUGS)
      expect(relatedTemplates(slug).some((t) => t.slug === slug)).toBe(false);
  });
});

describe("sitemap and robots", () => {
  it("lists studio pages and every template, never invitations or private areas", async () => {
    const { default: sitemap } = await import("@/app/sitemap");
    const urls = sitemap().map((e) => new URL(e.url).pathname);
    expect(urls).toEqual(expect.arrayContaining(["/", "/templates", "/privacy", "/terms"]));
    for (const slug of TEMPLATE_SLUGS) expect(urls).toContain(`/templates/${slug}`);
    expect(urls.some((u) => /^\/(i|dashboard|preview|api)\b/.test(u))).toBe(false);
  });

  it("disallows invitations, the dashboard and previews", async () => {
    const { default: robots } = await import("@/app/robots");
    const rules = robots().rules;
    const disallow = (Array.isArray(rules) ? rules[0] : rules)?.disallow;
    expect(disallow).toEqual(expect.arrayContaining(["/i/", "/dashboard", "/preview"]));
  });
});
