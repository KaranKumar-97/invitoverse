import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { AppError } from "@/lib/action-result";
import { prisma } from "@/server/db/prisma";
import {
  actingForGuest,
  actingForInvitation,
  auditAdminEdit,
} from "@/server/services/admin-acting";
import { makeUser, resetDb } from "./helpers";

async function expectCode(p: Promise<unknown>, code: string) {
  await expect(p).rejects.toSatisfy((e: unknown) => e instanceof AppError && e.code === code);
}

let ownerId: string;
let otherId: string;
let adminId: string;
let superId: string;
let invId: string;

beforeEach(async () => {
  await resetDb();
  await prisma.template.upsert({
    where: { slug: "royal-heritage" },
    create: { slug: "royal-heritage", name: "Royal Heritage", category: "ROYAL" },
    update: {},
  });
  ownerId = (await makeUser("Owner")).id;
  otherId = (await makeUser("Other")).id;
  adminId = (await makeUser("Admin")).id;
  superId = (await makeUser("Super")).id;
  await prisma.user.update({ where: { id: adminId }, data: { role: "ADMIN" } });
  await prisma.user.update({ where: { id: superId }, data: { role: "SUPERADMIN" } });
  invId = (
    await prisma.invitation.create({
      data: {
        ownerId,
        templateSlug: "royal-heritage",
        slug: "acting-test",
        title: "T",
        draftContent: {},
        draftDesign: {},
      },
    })
  ).id;
});

afterAll(async () => {
  await resetDb();
  await prisma.$disconnect();
});

describe("acting for an invitation", () => {
  it("owners act as themselves", async () => {
    const a = await actingForInvitation({ userId: ownerId }, invId);
    expect(a).toEqual({ ctx: { userId: ownerId }, asAdmin: false });
  });

  it("other users and view-only Admins get NOT_FOUND", async () => {
    await expectCode(actingForInvitation({ userId: otherId }, invId), "NOT_FOUND");
    await expectCode(actingForInvitation({ userId: adminId }, invId), "NOT_FOUND");
  });

  it("Superadmins (and Admins granted invitations.edit) act with the owner's ctx", async () => {
    expect(await actingForInvitation({ userId: superId }, invId)).toEqual({
      ctx: { userId: ownerId },
      asAdmin: true,
    });
    await prisma.adminPermission.create({
      data: { userId: adminId, key: "invitations.edit", allowed: true, grantedBy: superId },
    });
    expect((await actingForInvitation({ userId: adminId }, invId)).ctx.userId).toBe(ownerId);
    // Publishing needs its own permission.
    await expectCode(actingForInvitation({ userId: adminId }, invId, "sites.publish"), "NOT_FOUND");
  });

  it("groups repeated autosave audits within 10 minutes", async () => {
    await auditAdminEdit(superId, invId, "invitation.edited");
    await auditAdminEdit(superId, invId, "invitation.edited");
    await auditAdminEdit(superId, invId, "invitation.title_changed", { title: "X" });
    expect(await prisma.adminAuditLog.count({ where: { targetId: invId } })).toBe(2);
  });

  it("guest changes need invitations.guests, not invitations.edit", async () => {
    const g = await prisma.guest.create({
      data: { invitationId: invId, displayName: "Guest", token: "g".repeat(22) },
    });
    await prisma.adminPermission.create({
      data: { userId: adminId, key: "invitations.edit", allowed: true, grantedBy: superId },
    });
    await expectCode(actingForGuest({ userId: adminId }, g.id), "NOT_FOUND");
    await prisma.adminPermission.create({
      data: { userId: adminId, key: "invitations.guests", allowed: true, grantedBy: superId },
    });
    const a = await actingForGuest({ userId: adminId }, g.id);
    expect([a.ctx.userId, a.asAdmin, a.invitationId]).toEqual([ownerId, true, invId]);
    expect((await actingForGuest({ userId: ownerId }, g.id)).asAdmin).toBe(false);
  });
});
