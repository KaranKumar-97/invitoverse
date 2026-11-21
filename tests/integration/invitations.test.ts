import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { AppError } from "@/lib/action-result";
import { DraftContentSchema } from "@/lib/invitation/schema";
import { prisma } from "@/server/db/prisma";
import * as svc from "@/server/services/invitations";
import { makeUser, resetDb } from "./helpers";

type Ctx = { userId: string };
const create = (ctx: Ctx, over: Partial<Parameters<typeof svc.createInvitation>[1]> = {}) =>
  svc.createInvitation(ctx, {
    templateSlug: "royal-heritage",
    brideName: "Priya",
    groomName: "Rahul",
    order: "BRIDE_FIRST",
    weddingDate: "2027-02-14",
    ...over,
  });

async function expectCode(p: Promise<unknown>, code: string) {
  await expect(p).rejects.toSatisfy((e: unknown) => e instanceof AppError && e.code === code);
}

let a: Ctx;
let b: Ctx;

beforeEach(async () => {
  await resetDb();
  a = { userId: (await makeUser("Alice")).id };
  b = { userId: (await makeUser("Bob")).id };
});

afterAll(async () => {
  await resetDb();
  await prisma.$disconnect();
});

describe("createInvitation", () => {
  it("creates a draft with sample content, names and a slug from the couple", async () => {
    const { id, slug } = await create(a);
    expect(slug).toBe("priya-rahul");
    const inv = await svc.getInvitationForEditor(a, id);
    expect(inv.status).toBe("DRAFT");
    expect(inv.title).toBe("Priya & Rahul Wedding");
    expect(inv.content.couple.bride.firstName).toBe("Priya");
    expect(inv.content.weddingDate).toBe("2027-02-14");
    expect(inv.content.events.length).toBeGreaterThan(0);
    expect(inv.content.sample).toContain("events");
    expect(inv.design.paletteId).toBe("maroon-gold");
  });

  it("de-duplicates generated slugs", async () => {
    await create(a);
    const second = await create(b);
    expect(second.slug).toBe("priya-rahul-2");
  });

  it("rejects reserved / invalid custom slugs and unknown templates", async () => {
    await expectCode(create(a, { slug: "dashboard" }), "VALIDATION");
    await expectCode(create(a, { slug: "-bad-" }), "VALIDATION");
    await expectCode(create(a, { templateSlug: "does-not-exist" }), "NOT_FOUND");
    await expectCode(create(a, { templateSlug: "floral-romance" }), "NOT_FOUND"); // planned, inactive
  });

  it("conflicts on a taken custom slug", async () => {
    await create(a, { slug: "our-day" });
    await expectCode(create(b, { slug: "our-day" }), "CONFLICT");
  });

  it("enforces the active invitation limit", async () => {
    for (let i = 0; i < svc.MAX_ACTIVE_INVITATIONS; i++)
      await create(a, { slug: `limit-test-${i}` });
    await expectCode(create(a, { slug: "one-too-many" }), "LIMIT_EXCEEDED");
  });
});

describe("listInvitations / stats", () => {
  it("only returns the caller's invitations", async () => {
    await create(a);
    await create(b);
    const mine = await svc.listInvitations(a);
    expect(mine).toHaveLength(1);
    expect(mine[0]).toMatchObject({
      slug: "priya-rahul",
      templateName: "Royal Heritage",
      guestCount: 0,
      weddingDate: "2027-02-14",
    });
    expect((await svc.getOverviewStats(a)).invitations).toBe(1);
  });

  it("filters by status and search", async () => {
    const { id } = await create(a);
    await create(a, { brideName: "Anaya", groomName: "Kabir" });
    await svc.archiveInvitation(a, { id });
    expect(await svc.listInvitations(a, { status: "ACTIVE" })).toHaveLength(1);
    expect(await svc.listInvitations(a, { status: "ARCHIVED" })).toHaveLength(1);
    expect(await svc.listInvitations(a, { q: "anaya" })).toHaveLength(1);
  });
});

describe("saveDraft", () => {
  it("saves with the current timestamp and returns a new one", async () => {
    const { id } = await create(a);
    const inv = await svc.getInvitationForEditor(a, id);
    const content = { ...inv.content, city: "Jaipur" };
    const res = await svc.saveDraft(a, { id, draftUpdatedAt: inv.draftUpdatedAt, content });
    expect(res.draftUpdatedAt).not.toBe(inv.draftUpdatedAt);
    expect((await svc.getInvitationForEditor(a, id)).content.city).toBe("Jaipur");
  });

  it("detects concurrent edits (stale timestamp → CONFLICT)", async () => {
    const { id } = await create(a);
    const inv = await svc.getInvitationForEditor(a, id);
    await svc.saveDraft(a, { id, draftUpdatedAt: inv.draftUpdatedAt, content: inv.content });
    await expectCode(
      svc.saveDraft(a, { id, draftUpdatedAt: inv.draftUpdatedAt, content: inv.content }),
      "CONFLICT",
    );
  });

  it("accepts incomplete drafts but rejects bad shapes", async () => {
    const { id } = await create(a);
    const inv = await svc.getInvitationForEditor(a, id);
    const incomplete = {
      ...inv.content,
      couple: { ...inv.content.couple, bride: { firstName: "", lastName: "", shortBio: "" } },
    };
    const saved = await svc.saveDraft(a, {
      id,
      draftUpdatedAt: inv.draftUpdatedAt,
      content: incomplete,
    });
    const badShape = { ...inv.content, events: [{ id: "not-an-id" }] };
    await expectCode(
      svc.saveDraft(a, { id, draftUpdatedAt: saved.draftUpdatedAt, content: badShape }),
      "VALIDATION",
    );
    await expectCode(
      svc.saveDraft(a, { id, draftUpdatedAt: saved.draftUpdatedAt, design: { paletteId: 1 } }),
      "VALIDATION",
    );
  });

  it("denormalises the wedding date for the list", async () => {
    const { id } = await create(a);
    const inv = await svc.getInvitationForEditor(a, id);
    await svc.saveDraft(a, {
      id,
      draftUpdatedAt: inv.draftUpdatedAt,
      content: { ...inv.content, weddingDate: "2028-01-05" },
    });
    expect((await svc.listInvitations(a))[0].weddingDate).toBe("2028-01-05");
  });
});

describe("slugs, title, template", () => {
  it("checks availability with suggestions", async () => {
    await create(a);
    const taken = await svc.checkSlug(b, {
      slug: "priya-rahul",
      names: ["Priya", "Rahul"],
      weddingDate: "2027-02-14",
    });
    expect(taken.available).toBe(false);
    expect(taken.suggestions.length).toBeGreaterThan(0);
    expect(taken.suggestions).not.toContain("priya-rahul");
    expect((await svc.checkSlug(b, { slug: "admin" })).reason).toMatch(/reserved/i);
    expect((await svc.checkSlug(b, { slug: "fresh-link" })).available).toBe(true);
  });

  it("treats the invitation's own slug as available when excluded", async () => {
    const { id } = await create(a);
    expect((await svc.checkSlug(a, { slug: "priya-rahul", excludeId: id })).available).toBe(true);
  });

  it("changes slug, rejecting taken ones", async () => {
    const one = await create(a);
    const two = await create(a, { brideName: "Anaya", groomName: "Kabir" });
    await expectCode(svc.changeSlug(a, { id: two.id, slug: one.slug }), "CONFLICT");
    expect(await svc.changeSlug(a, { id: two.id, slug: "kabir-anaya-forever" })).toEqual({
      slug: "kabir-anaya-forever",
    });
  });

  it("switches template and resets design", async () => {
    const { id } = await create(a);
    const res = await svc.switchTemplate(a, { id, templateSlug: "minimal-luxury" });
    const inv = await svc.getInvitationForEditor(a, id);
    expect(inv.templateSlug).toBe("minimal-luxury");
    expect(inv.design.paletteId).toBe("ivory-ink");
    expect(inv.draftUpdatedAt).toBe(res.draftUpdatedAt);
    expect(inv.content.couple.bride.firstName).toBe("Priya"); // content untouched
  });
});

describe("duplicate / archive / restore / delete", () => {
  it("duplicates as a new draft without guests", async () => {
    const { id } = await create(a);
    await prisma.guest.create({
      data: { invitationId: id, displayName: "Sharma Family", token: "t".repeat(22) },
    });
    const copy = await svc.duplicateInvitation(a, { id });
    expect(copy.slug).toBe("priya-rahul-copy");
    const again = await svc.duplicateInvitation(a, { id: copy.id });
    expect(again.slug).toBe("priya-rahul-copy-2");
    expect(await prisma.guest.count({ where: { invitationId: copy.id } })).toBe(0);
    const inv = await svc.getInvitationForEditor(a, copy.id);
    expect(inv.title).toBe("Priya & Rahul Wedding (copy)");
    expect(inv.status).toBe("DRAFT");
  });

  it("only deletes archived invitations with the slug confirmed", async () => {
    const { id, slug } = await create(a);
    await expectCode(svc.deleteInvitation(a, { id, confirmSlug: slug }), "VALIDATION");
    await svc.archiveInvitation(a, { id });
    await expectCode(svc.deleteInvitation(a, { id, confirmSlug: "nope" }), "VALIDATION");
    await svc.restoreInvitation(a, { id });
    expect((await svc.getInvitationForEditor(a, id)).status).toBe("DRAFT");
    await svc.archiveInvitation(a, { id });
    await svc.deleteInvitation(a, { id, confirmSlug: slug });
    expect(await prisma.invitation.count({ where: { id } })).toBe(0);
  });
});

describe("ownership (cross-tenant access is NOT_FOUND)", () => {
  it("blocks every operation on another owner's invitation", async () => {
    const { id, slug } = await create(a);
    const inv = await svc.getInvitationForEditor(a, id);
    await expectCode(svc.getInvitationForEditor(b, id), "NOT_FOUND");
    await expectCode(
      svc.saveDraft(b, { id, draftUpdatedAt: inv.draftUpdatedAt, content: inv.content }),
      "NOT_FOUND",
    );
    await expectCode(svc.updateTitle(b, { id, title: "Hacked" }), "NOT_FOUND");
    await expectCode(svc.changeSlug(b, { id, slug: "stolen-link" }), "NOT_FOUND");
    await expectCode(svc.switchTemplate(b, { id, templateSlug: "minimal-luxury" }), "NOT_FOUND");
    await expectCode(svc.duplicateInvitation(b, { id }), "NOT_FOUND");
    await expectCode(svc.archiveInvitation(b, { id }), "NOT_FOUND");
    await expectCode(svc.restoreInvitation(b, { id }), "NOT_FOUND");
    await expectCode(svc.deleteInvitation(b, { id, confirmSlug: slug }), "NOT_FOUND");
    const after = await svc.getInvitationForEditor(a, id);
    expect(after.title).toBe("Priya & Rahul Wedding");
    expect(after.slug).toBe(slug);
    expect(after.status).toBe("DRAFT");
    expect(DraftContentSchema.safeParse(after.content).success).toBe(true);
  });
});
