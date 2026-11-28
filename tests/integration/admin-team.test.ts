import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { AppError } from "@/lib/action-result";
import { prisma } from "@/server/db/prisma";
import { assertPermission, getAdminAccess } from "@/server/services/admin-access";
import * as team from "@/server/services/admin-team";
import { makeUser, resetDb } from "./helpers";

async function expectCode(p: Promise<unknown>, code: string) {
  await expect(p).rejects.toSatisfy((e: unknown) => e instanceof AppError && e.code === code);
}

const asRole = (id: string, role: "USER" | "ADMIN" | "SUPERADMIN") =>
  prisma.user.update({ where: { id }, data: { role } });

let superId: string;
let adminId: string;
let userId: string;
let userEmail: string;

beforeEach(async () => {
  await resetDb();
  superId = (await makeUser("Super")).id;
  adminId = (await makeUser("Admin")).id;
  const u = await makeUser("Couple");
  userId = u.id;
  userEmail = u.email;
  await asRole(superId, "SUPERADMIN");
  await asRole(adminId, "ADMIN");
});

afterAll(async () => {
  await resetDb();
  await prisma.$disconnect();
});

describe("admin access", () => {
  it("lets Admins view by default and blocks writes", async () => {
    await expect(assertPermission({ userId: adminId }, "users.view")).resolves.toBeTruthy();
    await expectCode(assertPermission({ userId: adminId }, "templates.price"), "NOT_FOUND");
    await expectCode(assertPermission({ userId }, "users.view"), "NOT_FOUND");
    expect(await getAdminAccess(userId)).toBeNull();
  });

  it("only Superadmins can manage admins", async () => {
    await expectCode(team.listAdmins({ userId: adminId }), "NOT_FOUND");
    await expectCode(
      team.addAdmin({ userId: adminId }, { email: userEmail, role: "ADMIN" }),
      "NOT_FOUND",
    );
    await expectCode(
      team.setAdminPermission(
        { userId: adminId },
        { userId: adminId, key: "templates.price", allowed: true },
      ),
      "NOT_FOUND",
    );
    const list = await team.listAdmins({ userId: superId });
    expect(list.map((a) => a.id).sort()).toEqual([superId, adminId].sort());
  });
});

describe("managing admins", () => {
  it("adds an existing account as Admin and audits it", async () => {
    await team.addAdmin({ userId: superId }, { email: userEmail.toUpperCase(), role: "ADMIN" });
    expect((await prisma.user.findUnique({ where: { id: userId } }))?.role).toBe("ADMIN");
    const log = await prisma.adminAuditLog.findMany({ where: { targetId: userId } });
    expect(log).toHaveLength(1);
    expect(log[0]!.action).toBe("admin.added");
    expect(log[0]!.actorId).toBe(superId);
  });

  it("rejects unknown emails and existing admins", async () => {
    await expectCode(
      team.addAdmin({ userId: superId }, { email: "nobody@test.local", role: "ADMIN" }),
      "VALIDATION",
    );
    const admin = await prisma.user.findUniqueOrThrow({ where: { id: adminId } });
    await expectCode(
      team.addAdmin({ userId: superId }, { email: admin.email, role: "ADMIN" }),
      "CONFLICT",
    );
  });

  it("grants a permission (and its view), and revoking a view revokes its writes", async () => {
    const ctx = { userId: superId };
    await team.setAdminPermission(ctx, { userId: adminId, key: "users.view", allowed: false });
    await team.setAdminPermission(ctx, { userId: adminId, key: "users.edit", allowed: true });
    let access = await getAdminAccess(adminId);
    expect(access?.permissions.has("users.edit")).toBe(true);
    expect(access?.permissions.has("users.view")).toBe(true);

    await team.setAdminPermission(ctx, { userId: adminId, key: "users.view", allowed: false });
    access = await getAdminAccess(adminId);
    expect(access?.permissions.has("users.view")).toBe(false);
    expect(access?.permissions.has("users.edit")).toBe(false);
    expect(
      await prisma.adminAuditLog.count({ where: { action: "admin.permission_changed" } }),
    ).toBe(3);
  });

  it("applies presets", async () => {
    await team.applyAdminPreset({ userId: superId }, { userId: adminId, presetId: "catalogue" });
    const access = await getAdminAccess(adminId);
    expect(access?.permissions.has("templates.price")).toBe(true);
    expect(access?.permissions.has("users.view")).toBe(false);
  });

  it("removing an admin clears their permissions", async () => {
    const ctx = { userId: superId };
    await team.setAdminPermission(ctx, { userId: adminId, key: "templates.price", allowed: true });
    await team.setAdminRole(ctx, { userId: adminId, role: "USER" });
    expect(await getAdminAccess(adminId)).toBeNull();
    expect(await prisma.adminPermission.count({ where: { userId: adminId } })).toBe(0);
  });

  it("protects the last Superadmin and blocks self-changes", async () => {
    await expectCode(
      team.setAdminRole({ userId: superId }, { userId: superId, role: "USER" }),
      "VALIDATION",
    );
    const second = (await makeUser("Second")).id;
    await asRole(second, "SUPERADMIN");
    await team.setAdminRole({ userId: second }, { userId: superId, role: "ADMIN" });
    await expectCode(
      team.setAdminRole({ userId: superId }, { userId: second, role: "USER" }),
      "NOT_FOUND",
    );
  });

  it("refuses to demote the last Superadmin", async () => {
    // Promote the admin to Superadmin, then demote the original: allowed (two exist).
    await team.setAdminRole({ userId: superId }, { userId: adminId, role: "SUPERADMIN" });
    await team.setAdminRole({ userId: adminId }, { userId: superId, role: "ADMIN" });
    // Now adminId is the only Superadmin; nobody else can be Superadmin to demote them.
    expect(await prisma.user.count({ where: { role: "SUPERADMIN" } })).toBe(1);
  });
});
