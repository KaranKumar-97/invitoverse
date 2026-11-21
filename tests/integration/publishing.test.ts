import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { AppError } from "@/lib/action-result";
import { prisma } from "@/server/db/prisma";
import * as inv from "@/server/services/invitations";
import * as pub from "@/server/services/publishing";
import { loadPublishedBySlug, recordPublicOpen } from "@/server/services/public-invitations";
import { makeUser, resetDb } from "./helpers";

type Ctx = { userId: string };
let a: Ctx;
let b: Ctx;
let id: string;
let slug: string;

async function expectCode(p: Promise<unknown>, code: string) {
  await expect(p).rejects.toSatisfy((e: unknown) => e instanceof AppError && e.code === code);
}

async function editDraft(
  ctx: Ctx,
  invId: string,
  mutate: (c: Awaited<ReturnType<typeof inv.getInvitationForEditor>>["content"]) => void,
) {
  const ed = await inv.getInvitationForEditor(ctx, invId);
  mutate(ed.content);
  return inv.saveDraft(ctx, { id: invId, draftUpdatedAt: ed.draftUpdatedAt, content: ed.content });
}

beforeEach(async () => {
  await resetDb();
  a = { userId: (await makeUser("Alice")).id };
  b = { userId: (await makeUser("Bob")).id };
  ({ id, slug } = await inv.createInvitation(a, {
    templateSlug: "royal-heritage",
    brideName: "Priya",
    groomName: "Rahul",
    order: "BRIDE_FIRST",
    weddingDate: "2027-02-14",
  }));
});

afterAll(async () => {
  await resetDb();
  await prisma.$disconnect();
});

describe("publish", () => {
  it("is not public until published", async () => {
    expect(await loadPublishedBySlug(slug)).toBeNull();
    const state = await pub.getPublishState(a, id);
    expect(state.status).toBe("DRAFT");
    expect(state.canPublish).toBe(true);
  });

  it("publishes a strict snapshot and bumps the version", async () => {
    const res = await pub.publishInvitation(a, { id });
    expect(res).toMatchObject({ slug, publishedVersion: 1 });
    const live = await loadPublishedBySlug(slug);
    expect(live?.content.couple.bride.firstName).toBe("Priya");
    expect(live?.templateSlug).toBe("royal-heritage");
    expect((await pub.getPublishState(a, id)).hasUnpublishedChanges).toBe(false);
  });

  it("keeps drafts private: edits after publishing don't reach guests until republished", async () => {
    await pub.publishInvitation(a, { id });
    await editDraft(a, id, (c) => (c.couple.bride.firstName = "Priyanka"));
    expect((await loadPublishedBySlug(slug))?.content.couple.bride.firstName).toBe("Priya");
    expect((await pub.getPublishState(a, id)).hasUnpublishedChanges).toBe(true);
    const again = await pub.publishInvitation(a, { id });
    expect(again.publishedVersion).toBe(2);
    expect((await loadPublishedBySlug(slug))?.content.couple.bride.firstName).toBe("Priyanka");
  });

  it("snapshots the template too: switching design in the draft doesn't change the live page", async () => {
    await pub.publishInvitation(a, { id });
    await inv.switchTemplate(a, { id, templateSlug: "minimal-luxury" });
    expect((await loadPublishedBySlug(slug))?.templateSlug).toBe("royal-heritage");
  });

  it("refuses incomplete invitations with the failing checklist items", async () => {
    await editDraft(a, id, (c) => (c.couple.groom.firstName = ""));
    await expect(pub.publishInvitation(a, { id })).rejects.toSatisfy(
      (e: unknown) =>
        e instanceof AppError &&
        e.code === "VALIDATION" &&
        e.fieldErrors?.checklist?.includes("names") === true,
    );
    expect(await loadPublishedBySlug(slug)).toBeNull();
  });

  it("does not touch the draft timestamp (editor lock keeps working)", async () => {
    const before = (await inv.getInvitationForEditor(a, id)).draftUpdatedAt;
    await pub.publishInvitation(a, { id });
    expect((await inv.getInvitationForEditor(a, id)).draftUpdatedAt).toBe(before);
  });

  it("removes guests' references to deleted events", async () => {
    const ed = await inv.getInvitationForEditor(a, id);
    const [keep, drop] = ed.content.events;
    await prisma.guest.create({
      data: {
        invitationId: id,
        displayName: "Sharma Family",
        token: "a".repeat(22),
        eventAccess: "SELECTED",
        eventIds: [keep.id, drop.id, "evt_ghost00000"],
      },
    });
    await editDraft(a, id, (c) => (c.events = c.events.filter((e) => e.id !== drop.id)));
    await pub.publishInvitation(a, { id });
    const g = await prisma.guest.findFirstOrThrow({ where: { invitationId: id } });
    expect(g.eventIds).toEqual([keep.id]);
  });
});

describe("taking an invitation down", () => {
  it("unpublish, archive, disable and slug change all remove the public page", async () => {
    await pub.publishInvitation(a, { id });
    await pub.unpublishInvitation(a, { id });
    expect(await loadPublishedBySlug(slug)).toBeNull();

    await pub.publishInvitation(a, { id });
    await inv.archiveInvitation(a, { id });
    expect(await loadPublishedBySlug(slug)).toBeNull();
    await expectCode(pub.publishInvitation(a, { id }), "VALIDATION");

    await inv.restoreInvitation(a, { id });
    await pub.publishInvitation(a, { id });
    await prisma.invitation.update({ where: { id }, data: { disabledAt: new Date() } });
    expect(await loadPublishedBySlug(slug)).toBeNull();
    await expectCode(pub.publishInvitation(a, { id }), "FORBIDDEN");

    await prisma.invitation.update({ where: { id }, data: { disabledAt: null } });
    await inv.changeSlug(a, { id, slug: "new-link-here" });
    expect(await loadPublishedBySlug(slug)).toBeNull();
    expect((await loadPublishedBySlug("new-link-here"))?.id).toBe(id);
  });
});

describe("ownership & public data", () => {
  it("other owners can't read state, publish or unpublish", async () => {
    await expectCode(pub.getPublishState(b, id), "NOT_FOUND");
    await expectCode(pub.publishInvitation(b, { id }), "NOT_FOUND");
    await pub.publishInvitation(a, { id });
    await expectCode(pub.unpublishInvitation(b, { id }), "NOT_FOUND");
    expect(await loadPublishedBySlug(slug)).not.toBeNull();
  });

  it("public data contains no owner fields", async () => {
    await pub.publishInvitation(a, { id });
    const live = await loadPublishedBySlug(slug);
    const json = JSON.stringify(live);
    expect(json).not.toContain(a.userId);
    expect(json).not.toContain("ownerId");
    expect(json).not.toContain("draft");
  });

  it("counts opens only for live invitations", async () => {
    await recordPublicOpen(slug);
    expect((await prisma.invitation.findUniqueOrThrow({ where: { id } })).openCount).toBe(0);
    await pub.publishInvitation(a, { id });
    await recordPublicOpen(slug);
    await recordPublicOpen("not-a-real-slug");
    expect((await prisma.invitation.findUniqueOrThrow({ where: { id } })).openCount).toBe(1);
  });
});
