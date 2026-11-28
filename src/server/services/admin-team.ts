import "server-only";
import { AppError } from "@/lib/action-result";
import {
  effectivePermissions,
  isAdminRole,
  PERMISSION_PRESETS,
  PERMISSIONS,
  permissionDef,
  type PermissionKey,
} from "@/lib/admin/permissions";
import { prisma } from "@/server/db/prisma";
import { assertPermission, assertSuperadmin, recordAudit } from "./admin-access";
import type { Ctx } from "./context";

export type AdminRow = {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "SUPERADMIN";
  permissions: PermissionKey[];
  overrides: Array<{ key: string; allowed: boolean }>;
};

/** Superadmin only: every admin with their effective permissions. */
export async function listAdmins(ctx: Ctx): Promise<AdminRow[]> {
  await assertSuperadmin(ctx);
  const users = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SUPERADMIN"] }, deletedAt: null },
    orderBy: [{ role: "desc" }, { email: "asc" }],
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      adminPermissions: { select: { key: true, allowed: true } },
    },
  });
  return users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role as AdminRow["role"],
    permissions: [...effectivePermissions(u.role, u.adminPermissions)],
    overrides: u.adminPermissions,
  }));
}

async function countSuperadmins() {
  return prisma.user.count({ where: { role: "SUPERADMIN", deletedAt: null } });
}

/** Superadmin only: make an existing account (signed in at least once) an Admin or Superadmin. */
export async function addAdmin(ctx: Ctx, input: { email: string; role: "ADMIN" | "SUPERADMIN" }) {
  await assertSuperadmin(ctx);
  const email = input.email.trim().toLowerCase();
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" }, deletedAt: null },
    select: { id: true, role: true },
  });
  if (!user) {
    throw new AppError(
      "VALIDATION",
      "No account with that email. Ask them to sign in once first.",
      {
        email: ["No account with that email"],
      },
    );
  }
  if (user.id === ctx.userId) throw new AppError("VALIDATION", "You can't change your own role.");
  if (isAdminRole(user.role)) {
    throw new AppError("CONFLICT", "That account is already an admin.");
  }
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: user.id }, data: { role: input.role } });
    await recordAudit(tx, {
      actorId: ctx.userId,
      action: "admin.added",
      targetType: "admin",
      targetId: user.id,
      before: { role: user.role },
      after: { role: input.role },
    });
  });
  return { id: user.id };
}

/** Superadmin only: change an admin's role (USER removes admin access and their overrides). */
export async function setAdminRole(
  ctx: Ctx,
  input: { userId: string; role: "USER" | "ADMIN" | "SUPERADMIN" },
) {
  await assertSuperadmin(ctx);
  if (input.userId === ctx.userId) {
    throw new AppError("VALIDATION", "You can't change your own role.");
  }
  const target = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { role: true, deletedAt: true },
  });
  if (!target || target.deletedAt || !isAdminRole(target.role)) throw new AppError("NOT_FOUND");
  if (target.role === input.role) return { ok: true };
  if (target.role === "SUPERADMIN" && (await countSuperadmins()) <= 1) {
    throw new AppError("VALIDATION", "There must always be at least one Superadmin.");
  }
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: input.userId }, data: { role: input.role } });
    if (input.role !== "ADMIN") {
      await tx.adminPermission.deleteMany({ where: { userId: input.userId } });
    }
    await recordAudit(tx, {
      actorId: ctx.userId,
      action: input.role === "USER" ? "admin.removed" : "admin.role_changed",
      targetType: "admin",
      targetId: input.userId,
      before: { role: target.role },
      after: { role: input.role },
    });
  });
  return { ok: true };
}

async function requireAdminTarget(ctx: Ctx, userId: string) {
  if (userId === ctx.userId) {
    throw new AppError("VALIDATION", "You can't change your own permissions.");
  }
  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, deletedAt: true },
  });
  if (!target || target.deletedAt || target.role !== "ADMIN") throw new AppError("NOT_FOUND");
}

/**
 * Superadmin only: turn one permission on or off for an Admin. Turning a write permission on also
 * turns on the view it needs; turning a view off also turns off the writes that need it.
 */
export async function setAdminPermission(
  ctx: Ctx,
  input: { userId: string; key: PermissionKey; allowed: boolean },
) {
  await assertSuperadmin(ctx);
  await requireAdminTarget(ctx, input.userId);
  const changes = new Map<PermissionKey, boolean>([[input.key, input.allowed]]);
  const def = permissionDef(input.key);
  if (input.allowed && def.requires) changes.set(def.requires as PermissionKey, true);
  if (!input.allowed) {
    for (const p of PERMISSIONS) {
      if ("requires" in p && p.requires === input.key) changes.set(p.key, false);
    }
  }
  await prisma.$transaction(async (tx) => {
    for (const [key, allowed] of changes) {
      await tx.adminPermission.upsert({
        where: { userId_key: { userId: input.userId, key } },
        create: { userId: input.userId, key, allowed, grantedBy: ctx.userId },
        update: { allowed, grantedBy: ctx.userId },
      });
    }
    await recordAudit(tx, {
      actorId: ctx.userId,
      action: "admin.permission_changed",
      targetType: "admin",
      targetId: input.userId,
      after: Object.fromEntries(changes),
    });
  });
  return { ok: true };
}

/** Superadmin only: set every permission for an Admin from a preset. */
export async function applyAdminPreset(ctx: Ctx, input: { userId: string; presetId: string }) {
  await assertSuperadmin(ctx);
  await requireAdminTarget(ctx, input.userId);
  const preset = PERMISSION_PRESETS.find((p) => p.id === input.presetId);
  if (!preset) throw new AppError("VALIDATION", "Unknown preset.");
  const on = new Set<string>(preset.keys);
  await prisma.$transaction(async (tx) => {
    for (const p of PERMISSIONS) {
      const allowed = on.has(p.key);
      await tx.adminPermission.upsert({
        where: { userId_key: { userId: input.userId, key: p.key } },
        create: { userId: input.userId, key: p.key, allowed, grantedBy: ctx.userId },
        update: { allowed, grantedBy: ctx.userId },
      });
    }
    await recordAudit(tx, {
      actorId: ctx.userId,
      action: "admin.preset_applied",
      targetType: "admin",
      targetId: input.userId,
      after: { preset: preset.id },
    });
  });
  return { ok: true };
}

/** Admins with audit.view: the latest audit entries, newest first. */
export async function listAuditLog(ctx: Ctx, opts: { take?: number; cursor?: string } = {}) {
  await assertPermission(ctx, "audit.view");
  const rows = await prisma.adminAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: (opts.take ?? 50) + 1,
    ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
  });
  const actorIds = [...new Set(rows.map((r) => r.actorId))];
  const actors = await prisma.user.findMany({
    where: { id: { in: actorIds } },
    select: { id: true, email: true, name: true },
  });
  const take = opts.take ?? 50;
  return {
    rows: rows.slice(0, take).map((r) => ({
      ...r,
      actor: actors.find((a) => a.id === r.actorId) ?? null,
    })),
    nextCursor: rows.length > take ? rows[take - 1]!.id : null,
  };
}
