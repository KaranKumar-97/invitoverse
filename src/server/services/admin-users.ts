import "server-only";
import type { Prisma } from "@prisma/client";
import { AppError } from "@/lib/action-result";
import { invalidatePublic } from "@/server/cache-tags";
import { prisma } from "@/server/db/prisma";
import { assertPermission, recordAudit } from "./admin-access";
import type { Ctx } from "./context";

/**
 * Users and everything they own, for admins (docs/19 §4.2). Reads need users.view; guest contact
 * details are masked unless revealed with users.view_pii (each reveal is audited). Suspending
 * needs users.edit.
 */

const PAGE_SIZE = 25;

export type UserFilter = {
  q?: string;
  status?: "all" | "active" | "suspended" | "admins";
  page?: number;
};

export async function listUsers(ctx: Ctx, filter: UserFilter = {}) {
  await assertPermission(ctx, "users.view");
  const q = filter.q?.trim();
  const where: Prisma.UserWhereInput = {
    deletedAt: null,
    ...(filter.status === "active" ? { suspendedAt: null } : {}),
    ...(filter.status === "suspended" ? { suspendedAt: { not: null } } : {}),
    ...(filter.status === "admins" ? { role: { in: ["ADMIN", "SUPERADMIN"] } } : {}),
    ...(q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const page = Math.max(1, filter.page ?? 1);
  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        suspendedAt: true,
        accounts: { select: { provider: true } },
      },
    }),
  ]);
  const counts = await prisma.invitation.groupBy({
    by: ["ownerId", "status"],
    where: { ownerId: { in: users.map((u) => u.id) } },
    _count: { _all: true },
  });
  const count = (id: string, status: string) =>
    counts.find((c) => c.ownerId === id && c.status === status)?._count._all ?? 0;
  return {
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      createdAt: u.createdAt.toISOString(),
      suspended: Boolean(u.suspendedAt),
      providers: [...new Set(u.accounts.map((a) => a.provider))],
      invitations: {
        draft: count(u.id, "DRAFT"),
        published: count(u.id, "PUBLISHED"),
        archived: count(u.id, "ARCHIVED"),
      },
    })),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getUserDetail(ctx: Ctx, userId: string) {
  await assertPermission(ctx, "users.view");
  const u = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      suspendedAt: true,
      accounts: { select: { provider: true } },
      sessions: { select: { expires: true }, orderBy: { expires: "desc" }, take: 1 },
      entitlements: {
        select: { id: true, type: true, templateSlug: true, source: true, expiresAt: true },
      },
      invitations: {
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          templateSlug: true,
          weddingDate: true,
          updatedAt: true,
          openCount: true,
          disabledAt: true,
          _count: { select: { guests: true } },
        },
      },
    },
  });
  if (!u) throw new AppError("NOT_FOUND");
  const media = await prisma.mediaAsset.aggregate({
    where: { ownerId: u.id, deletedAt: null },
    _count: { _all: true },
    _sum: { bytes: true },
  });
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
    suspended: Boolean(u.suspendedAt),
    providers: [...new Set(u.accounts.map((a) => a.provider))],
    sessionUntil: u.sessions[0]?.expires.toISOString() ?? null,
    entitlements: u.entitlements.map((e) => ({
      ...e,
      expiresAt: e.expiresAt?.toISOString() ?? null,
    })),
    media: { count: media._count._all, bytes: media._sum.bytes ?? 0 },
    invitations: u.invitations.map((i) => ({
      id: i.id,
      title: i.title,
      slug: i.slug,
      status: i.status,
      templateSlug: i.templateSlug,
      weddingDate: i.weddingDate?.toISOString().slice(0, 10) ?? null,
      updatedAt: i.updatedAt.toISOString(),
      openCount: i.openCount,
      guests: i._count.guests,
      disabled: Boolean(i.disabledAt),
    })),
  };
}

/** `+91 98•••••210` style; emails → `p•••@example.com`. */
export function maskContact(value: string | null): string | null {
  if (!value) return value;
  if (value.includes("@")) {
    const [name, domain] = value.split("@");
    return `${name!.slice(0, 1)}•••@${domain}`;
  }
  const digits = value.replace(/\s+/g, "");
  if (digits.length <= 5) return "•••";
  return `${digits.slice(0, digits.length - 8 > 0 ? digits.length - 8 : 2)}•••••${digits.slice(-3)}`;
}

/**
 * One invitation as the admin sees it: settings, draft and published state, guests (contacts
 * masked) and media. Guest tokens are never returned.
 */
export async function getInvitationAdminView(ctx: Ctx, invitationId: string) {
  await assertPermission(ctx, "users.view");
  const inv = await prisma.invitation.findUnique({
    where: { id: invitationId },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      ownerId: true,
      owner: { select: { email: true, name: true } },
      templateSlug: true,
      publishedTemplateSlug: true,
      draftContent: true,
      draftDesign: true,
      draftUpdatedAt: true,
      publishedContent: true,
      publishedVersion: true,
      publishedAt: true,
      disabledAt: true,
      disabledReason: true,
      openCount: true,
      createdAt: true,
      guests: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          displayName: true,
          phone: true,
          eventAccess: true,
          eventIds: true,
          status: true,
          openCount: true,
          lastOpenedAt: true,
        },
      },
      mediaAssets: {
        where: { deletedAt: null },
        select: {
          id: true,
          kind: true,
          role: true,
          url: true,
          bytes: true,
          width: true,
          height: true,
        },
      },
    },
  });
  if (!inv) throw new AppError("NOT_FOUND");
  return {
    ...inv,
    draftUpdatedAt: inv.draftUpdatedAt.toISOString(),
    publishedAt: inv.publishedAt?.toISOString() ?? null,
    disabledAt: inv.disabledAt?.toISOString() ?? null,
    createdAt: inv.createdAt.toISOString(),
    guests: inv.guests.map((g) => ({
      ...g,
      phone: maskContact(g.phone),
      hasPhone: Boolean(g.phone),
      lastOpenedAt: g.lastOpenedAt?.toISOString() ?? null,
    })),
  };
}

/** users.view_pii: one guest's unmasked phone, audited. */
export async function revealGuestContact(ctx: Ctx, input: { guestId: string }) {
  await assertPermission(ctx, "users.view_pii");
  const g = await prisma.guest.findUnique({
    where: { id: input.guestId },
    select: { id: true, phone: true, invitationId: true },
  });
  if (!g) throw new AppError("NOT_FOUND");
  await prisma.$transaction((tx) =>
    recordAudit(tx, {
      actorId: ctx.userId,
      action: "guest.contact_revealed",
      targetType: "guest",
      targetId: g.id,
      after: { invitationId: g.invitationId },
    }),
  );
  return { phone: g.phone };
}

/** users.edit: suspend (signs them out everywhere, blocks sign-in) or restore an account. */
export async function setUserSuspended(
  ctx: Ctx,
  input: { userId: string; suspended: boolean; reason?: string },
) {
  await assertPermission(ctx, "users.edit");
  if (input.userId === ctx.userId) throw new AppError("VALIDATION", "You can't suspend yourself.");
  const u = await prisma.user.findFirst({
    where: { id: input.userId, deletedAt: null },
    select: { id: true, role: true, suspendedAt: true },
  });
  if (!u) throw new AppError("NOT_FOUND");
  if (u.role === "SUPERADMIN") throw new AppError("VALIDATION", "Superadmins can't be suspended.");
  if (Boolean(u.suspendedAt) === input.suspended) return { ok: true };
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: u.id },
      data: { suspendedAt: input.suspended ? new Date() : null },
    });
    if (input.suspended) await tx.session.deleteMany({ where: { userId: u.id } });
    await recordAudit(tx, {
      actorId: ctx.userId,
      action: input.suspended ? "user.suspended" : "user.restored",
      targetType: "user",
      targetId: u.id,
      reason: input.reason,
    });
  });
  return { ok: true };
}

/** users.edit: change a user's display name. */
export async function renameUser(ctx: Ctx, input: { userId: string; name: string }) {
  await assertPermission(ctx, "users.edit");
  const u = await prisma.user.findFirst({
    where: { id: input.userId, deletedAt: null },
    select: { id: true, name: true },
  });
  if (!u) throw new AppError("NOT_FOUND");
  const name = input.name.trim().slice(0, 80) || null;
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: u.id }, data: { name } });
    await recordAudit(tx, {
      actorId: ctx.userId,
      action: "user.renamed",
      targetType: "user",
      targetId: u.id,
      before: { name: u.name },
      after: { name },
    });
  });
  return { ok: true };
}

/** users.entitlements: give a user a template (ADMIN_GRANT), optionally until a date. */
export async function grantTemplateAccess(
  ctx: Ctx,
  input: { userId: string; templateSlug: string; expiresAt: string | null },
) {
  await assertPermission(ctx, "users.entitlements");
  const [u, t] = await Promise.all([
    prisma.user.findFirst({ where: { id: input.userId, deletedAt: null }, select: { id: true } }),
    prisma.template.findUnique({ where: { slug: input.templateSlug }, select: { slug: true } }),
  ]);
  if (!u || !t) throw new AppError("NOT_FOUND");
  const expiresAt = input.expiresAt ? new Date(`${input.expiresAt}T23:59:59Z`) : null;
  if (expiresAt && expiresAt < new Date())
    throw new AppError("VALIDATION", "Pick a date in the future.");
  const created = await prisma.$transaction(async (tx) => {
    const e = await tx.entitlement.create({
      data: {
        userId: u.id,
        type: "TEMPLATE",
        templateSlug: t.slug,
        source: "ADMIN_GRANT",
        expiresAt,
      },
    });
    await recordAudit(tx, {
      actorId: ctx.userId,
      action: "user.access_granted",
      targetType: "user",
      targetId: u.id,
      after: { templateSlug: t.slug, expiresAt: input.expiresAt },
    });
    return e;
  });
  return { id: created.id };
}

/** users.entitlements: remove an access grant. */
export async function revokeAccess(ctx: Ctx, input: { entitlementId: string }) {
  await assertPermission(ctx, "users.entitlements");
  const e = await prisma.entitlement.findUnique({ where: { id: input.entitlementId } });
  if (!e) throw new AppError("NOT_FOUND");
  await prisma.$transaction(async (tx) => {
    await tx.entitlement.delete({ where: { id: e.id } });
    await recordAudit(tx, {
      actorId: ctx.userId,
      action: "user.access_revoked",
      targetType: "user",
      targetId: e.userId,
      before: { templateSlug: e.templateSlug, source: e.source },
    });
  });
  return { ok: true };
}

/**
 * users.delete: delete an account (docs/03 §account delete). Soft delete: signed out, can't sign
 * in, every invitation archived and taken down; the nightly purge removes it after 30 days.
 * The user must type their email to confirm.
 */
export async function deleteUserAccount(
  ctx: Ctx,
  input: { userId: string; confirmEmail: string; reason: string },
) {
  await assertPermission(ctx, "users.delete");
  if (input.userId === ctx.userId) throw new AppError("VALIDATION", "You can't delete yourself.");
  const u = await prisma.user.findFirst({
    where: { id: input.userId, deletedAt: null },
    select: { id: true, email: true, role: true },
  });
  if (!u) throw new AppError("NOT_FOUND");
  if (u.role === "SUPERADMIN") throw new AppError("VALIDATION", "Superadmins can't be deleted.");
  if (input.confirmEmail.trim().toLowerCase() !== u.email.toLowerCase())
    throw new AppError("VALIDATION", "Type the account's email exactly to confirm.", {
      confirmEmail: ["Doesn't match"],
    });
  const now = new Date();
  const slugs = await prisma.invitation.findMany({
    where: { ownerId: u.id },
    select: { slug: true },
  });
  await prisma.$transaction(async (tx) => {
    await tx.invitation.updateMany({
      where: { ownerId: u.id },
      data: {
        status: "ARCHIVED",
        archivedAt: now,
        disabledAt: now,
        disabledReason: "Account deleted",
      },
    });
    await tx.session.deleteMany({ where: { userId: u.id } });
    await tx.adminPermission.deleteMany({ where: { userId: u.id } });
    await tx.user.update({ where: { id: u.id }, data: { deletedAt: now, role: "USER" } });
    await recordAudit(tx, {
      actorId: ctx.userId,
      action: "user.deleted",
      targetType: "user",
      targetId: u.id,
      reason: input.reason,
      after: { invitations: slugs.length },
    });
  });
  invalidatePublic(...slugs.map((s) => s.slug));
  return { ok: true };
}
