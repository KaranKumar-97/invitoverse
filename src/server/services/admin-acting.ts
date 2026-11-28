import "server-only";
import { AppError } from "@/lib/action-result";
import type { PermissionKey } from "@/lib/admin/permissions";
import { prisma } from "@/server/db/prisma";
import { assertPermission, recordAudit } from "./admin-access";
import type { Ctx } from "./context";

/**
 * Editing as an admin (docs/19 §4.2). Owner-scoped services stay unchanged: when the caller isn't
 * the owner but has `need` (e.g. invitations.edit), they act with the owner's ctx. Everyone else
 * gets NOT_FOUND, exactly as before.
 */
export type Acting = { ctx: Ctx; asAdmin: boolean };

async function resolve(ctx: Ctx, ownerId: string | null | undefined, need: PermissionKey) {
  if (!ownerId) throw new AppError("NOT_FOUND");
  if (ownerId === ctx.userId) return { ctx, asAdmin: false };
  await assertPermission(ctx, need);
  return { ctx: { userId: ownerId }, asAdmin: true };
}

export async function actingForInvitation(
  ctx: Ctx,
  invitationId: string,
  need: PermissionKey = "invitations.edit",
): Promise<Acting> {
  const inv = await prisma.invitation.findUnique({
    where: { id: invitationId },
    select: { ownerId: true },
  });
  return resolve(ctx, inv?.ownerId, need);
}

export async function actingForMedia(
  ctx: Ctx,
  mediaId: string,
  need: PermissionKey = "invitations.edit",
): Promise<Acting> {
  const m = await prisma.mediaAsset.findUnique({
    where: { id: mediaId },
    select: { ownerId: true },
  });
  return resolve(ctx, m?.ownerId, need);
}

export async function actingForGuest(
  ctx: Ctx,
  guestId: string,
  need: PermissionKey = "invitations.guests",
): Promise<Acting & { invitationId: string | null }> {
  const g = await prisma.guest.findUnique({
    where: { id: guestId },
    select: { invitationId: true, invitation: { select: { ownerId: true } } },
  });
  return {
    ...(await resolve(ctx, g?.invitation.ownerId, need)),
    invitationId: g?.invitationId ?? null,
  };
}

/**
 * Audit an admin's change to someone else's invitation. Autosave fires constantly, so repeated
 * edits of the same kind by the same admin within 10 minutes share one entry.
 */
export async function auditAdminEdit(
  actorId: string,
  invitationId: string,
  action: string,
  after?: Record<string, string | number | boolean | null>,
) {
  if (action === "invitation.edited") {
    const recent = await prisma.adminAuditLog.findFirst({
      where: {
        actorId,
        action,
        targetId: invitationId,
        createdAt: { gt: new Date(Date.now() - 10 * 60_000) },
      },
      select: { id: true },
    });
    if (recent) return;
  }
  await prisma.$transaction((tx) =>
    recordAudit(tx, { actorId, action, targetType: "invitation", targetId: invitationId, after }),
  );
}

/** Name or email of the owner an admin is acting for (for the editor's admin banner). */
export async function ownerLabel(userId: string): Promise<string> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });
  return u?.name || u?.email || "this user";
}
