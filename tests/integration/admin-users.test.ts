import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { AppError } from "@/lib/action-result";
import { prisma } from "@/server/db/prisma";
import * as svc from "@/server/services/admin-users";
import { makeUser, resetDb } from "./helpers";

async function expectCode(p: Promise<unknown>, code: string) {
  await expect(p).rejects.toSatisfy((e: unknown) => e instanceof AppError && e.code === code);
}

let superCtx: { userId: string };
let adminCtx: { userId: string };
let ownerId: string;
let guestId: string;
let invId: string;

beforeEach(async () => {
  await resetDb();
  await prisma.template.upsert({
    where: { slug: "royal-heritage" },
    create: { slug: "royal-heritage", name: "Royal Heritage", category: "ROYAL" },
    update: {},
  });
  const s = await makeUser("Super");
  const a = await makeUser("Admin");
  const o = await makeUser("Owner");
  await prisma.user.update({ where: { id: s.id }, data: { role: "SUPERADMIN" } });
  await prisma.user.update({ where: { id: a.id }, data: { role: "ADMIN" } });
  superCtx = { userId: s.id };
  adminCtx = { userId: a.id };
  ownerId = o.id;
  const inv = await prisma.invitation.create({
    data: {
      ownerId,
      templateSlug: "royal-heritage",
      slug: "owner-site",
      title: "Owner site",
      draftContent: {},
      draftDesign: {},
    },
  });
  invId = inv.id;
  const g = await prisma.guest.create({
    data: {
      invitationId: inv.id,
      displayName: "Sharma family",
      phone: "+919812345210",
      token: "t".repeat(22),
    },
  });
  guestId = g.id;
  await prisma.session.create({
    data: {
      sessionToken: "sess-owner",
      userId: ownerId,
      expires: new Date(Date.now() + 86400_000),
    },
  });
});

afterAll(async () => {
  await resetDb();
  await prisma.$disconnect();
});

describe("admin users", () => {
  it("masks contacts", () => {
    expect(svc.maskContact("+919812345210")).toBe("+9198•••••210");
    expect(svc.maskContact("priya@example.com")).toBe("p•••@example.com");
    expect(svc.maskContact(null)).toBeNull();
  });

  it("Admins can list users and view an invitation with masked phones and no tokens", async () => {
    const list = await svc.listUsers(adminCtx, { q: "owner" });
    expect(list.users.map((u) => u.id)).toEqual([ownerId]);
    const view = await svc.getInvitationAdminView(adminCtx, invId);
    expect(view.guests[0]!.phone).toBe("+9198•••••210");
    expect(JSON.stringify(view)).not.toContain("t".repeat(22));
  });

  it("revealing a phone needs users.view_pii and is audited", async () => {
    await expectCode(svc.revealGuestContact(adminCtx, { guestId }), "NOT_FOUND");
    const res = await svc.revealGuestContact(superCtx, { guestId });
    expect(res.phone).toBe("+919812345210");
    expect(await prisma.adminAuditLog.count({ where: { action: "guest.contact_revealed" } })).toBe(
      1,
    );
  });

  it("suspending needs users.edit, signs the user out and can be undone", async () => {
    await expectCode(
      svc.setUserSuspended(adminCtx, { userId: ownerId, suspended: true }),
      "NOT_FOUND",
    );
    await svc.setUserSuspended(superCtx, { userId: ownerId, suspended: true, reason: "Spam" });
    expect(await prisma.session.count({ where: { userId: ownerId } })).toBe(0);
    expect((await svc.listUsers(superCtx, { status: "suspended" })).total).toBe(1);
    await svc.setUserSuspended(superCtx, { userId: ownerId, suspended: false });
    const u = await prisma.user.findUniqueOrThrow({ where: { id: ownerId } });
    expect(u.suspendedAt).toBeNull();
  });

  it("refuses to suspend yourself or a Superadmin", async () => {
    await expectCode(
      svc.setUserSuspended(superCtx, { userId: superCtx.userId, suspended: true }),
      "VALIDATION",
    );
    await prisma.adminPermission.create({
      data: {
        userId: adminCtx.userId,
        key: "users.edit",
        allowed: true,
        grantedBy: superCtx.userId,
      },
    });
    await expectCode(
      svc.setUserSuspended(adminCtx, { userId: superCtx.userId, suspended: true }),
      "VALIDATION",
    );
  });

  it("renames, grants and revokes access, audited", async () => {
    await svc.renameUser(superCtx, { userId: ownerId, name: "Asha Rao" });
    const { id } = await svc.grantTemplateAccess(superCtx, {
      userId: ownerId,
      templateSlug: "royal-heritage",
      expiresAt: null,
    });
    expect((await prisma.entitlement.findUniqueOrThrow({ where: { id } })).source).toBe(
      "ADMIN_GRANT",
    );
    await svc.revokeAccess(superCtx, { entitlementId: id });
    expect(await prisma.entitlement.count()).toBe(0);
    const actions = (await prisma.adminAuditLog.findMany({ orderBy: { createdAt: "asc" } })).map(
      (r) => r.action,
    );
    expect(actions).toEqual(["user.renamed", "user.access_granted", "user.access_revoked"]);
    await expectCode(
      svc.grantTemplateAccess(adminCtx, {
        userId: ownerId,
        templateSlug: "royal-heritage",
        expiresAt: null,
      }),
      "NOT_FOUND",
    );
  });

  it("deletes an account only with the email typed, archiving and taking down its invitations", async () => {
    await expectCode(
      svc.deleteUserAccount(superCtx, { userId: ownerId, confirmEmail: "wrong@x", reason: "Spam" }),
      "VALIDATION",
    );
    const owner = await prisma.user.findUniqueOrThrow({ where: { id: ownerId } });
    await svc.deleteUserAccount(superCtx, {
      userId: ownerId,
      confirmEmail: owner.email,
      reason: "Spam",
    });
    const after = await prisma.user.findUniqueOrThrow({ where: { id: ownerId } });
    expect(after.deletedAt).not.toBeNull();
    const inv = await prisma.invitation.findUniqueOrThrow({ where: { id: invId } });
    expect([inv.status, Boolean(inv.disabledAt)]).toEqual(["ARCHIVED", true]);
    expect(await prisma.session.count({ where: { userId: ownerId } })).toBe(0);
  });
});
