import "server-only";
import type { Prisma } from "@prisma/client";
import { AppError } from "@/lib/action-result";
import {
  effectivePermissions,
  isAdminRole,
  type AdminRole,
  type PermissionKey,
} from "@/lib/admin/permissions";
import { prisma } from "@/server/db/prisma";
import type { Ctx } from "./context";

export type AdminAccess = { userId: string; role: AdminRole; permissions: Set<PermissionKey> };

/** The caller's admin role and effective permissions, or null for non-admins (and deleted users). */
export async function getAdminAccess(userId: string): Promise<AdminAccess | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      deletedAt: true,
      adminPermissions: { select: { key: true, allowed: true } },
    },
  });
  if (!user || user.deletedAt || !isAdminRole(user.role)) return null;
  return {
    userId,
    role: user.role,
    permissions: effectivePermissions(user.role, user.adminPermissions),
  };
}

/**
 * Throws NOT_FOUND (not FORBIDDEN, so admin features stay invisible) unless the caller has `key`.
 * Every admin service calls this first; pages and buttons only mirror it.
 */
export async function assertPermission(ctx: Ctx, key: PermissionKey): Promise<AdminAccess> {
  const access = await getAdminAccess(ctx.userId);
  if (!access || !access.permissions.has(key)) throw new AppError("NOT_FOUND");
  return access;
}

export async function assertSuperadmin(ctx: Ctx): Promise<AdminAccess> {
  const access = await getAdminAccess(ctx.userId);
  if (access?.role !== "SUPERADMIN") throw new AppError("NOT_FOUND");
  return access;
}

export type AuditEntry = {
  actorId: string;
  action: string;
  targetType: "template" | "user" | "invitation" | "guest" | "track" | "asset" | "admin";
  targetId: string;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
  reason?: string;
};

/** Append one audit row; pass the transaction client so it commits with the change. */
export function recordAudit(db: Prisma.TransactionClient, e: AuditEntry) {
  return db.adminAuditLog.create({ data: e });
}
