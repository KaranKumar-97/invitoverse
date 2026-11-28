import "server-only";
import type { Prisma } from "@prisma/client";
import { AppError } from "@/lib/action-result";
import { invalidatePublic } from "@/server/cache-tags";
import { prisma } from "@/server/db/prisma";
import { logEvent } from "@/server/log";
import { assertPermission, recordAudit } from "./admin-access";
import type { Ctx } from "./context";
import * as invitations from "./invitations";
import * as publishing from "./publishing";

/**
 * Deployed (published) sites for admins (docs/19 §4.5). Changes to a site reuse the owner's own
 * services, called on the owner's behalf after the admin's permission check, so publishing,
 * links and cache purging behave exactly as they do for couples. Every change is audited.
 */

export type SiteFilter = {
  q?: string;
  status?: "live" | "down" | "unpublished" | "all";
  page?: number;
};

export type SiteRow = {
  id: string;
  slug: string;
  title: string;
  templateSlug: string;
  ownerEmail: string;
  ownerId: string;
  publishedAt: string | null;
  publishedVersion: number;
  openCount: number;
  guests: number;
  disabledAt: string | null;
  disabledReason: string | null;
  state: "live" | "down" | "unpublished";
};

const PAGE_SIZE = 25;

/** sites.view: sites that are or were published (live, taken down, unpublished), newest first. */
export async function listSites(ctx: Ctx, filter: SiteFilter = {}) {
  await assertPermission(ctx, "sites.view");
  const q = filter.q?.trim();
  const everPublished: Prisma.InvitationWhereInput = {
    OR: [{ status: "PUBLISHED" }, { status: "DRAFT", publishedVersion: { gt: 0 } }],
  };
  const byState: Record<NonNullable<SiteFilter["status"]>, Prisma.InvitationWhereInput> = {
    live: { status: "PUBLISHED", disabledAt: null },
    down: { status: "PUBLISHED", disabledAt: { not: null } },
    unpublished: { status: "DRAFT", publishedVersion: { gt: 0 } },
    all: everPublished,
  };
  const where: Prisma.InvitationWhereInput = {
    AND: [byState[filter.status ?? "all"]],
    ...(q
      ? {
          OR: [
            { slug: { contains: q, mode: "insensitive" } },
            { title: { contains: q, mode: "insensitive" } },
            { owner: { email: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
  const page = Math.max(1, filter.page ?? 1);
  const [total, rows] = await Promise.all([
    prisma.invitation.count({ where }),
    prisma.invitation.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        slug: true,
        title: true,
        templateSlug: true,
        publishedTemplateSlug: true,
        publishedAt: true,
        publishedVersion: true,
        openCount: true,
        disabledAt: true,
        disabledReason: true,
        status: true,
        ownerId: true,
        owner: { select: { email: true } },
        _count: { select: { guests: true } },
      },
    }),
  ]);
  const sites: SiteRow[] = rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    templateSlug: r.publishedTemplateSlug ?? r.templateSlug,
    ownerEmail: r.owner.email,
    ownerId: r.ownerId,
    publishedAt: r.publishedAt?.toISOString() ?? null,
    publishedVersion: r.publishedVersion,
    openCount: r.openCount,
    guests: r._count.guests,
    disabledAt: r.disabledAt?.toISOString() ?? null,
    disabledReason: r.disabledReason,
    state: r.status !== "PUBLISHED" ? "unpublished" : r.disabledAt ? "down" : "live",
  }));
  return { sites, total, page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

async function findSite(id: string) {
  const inv = await prisma.invitation.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      title: true,
      ownerId: true,
      status: true,
      disabledAt: true,
      disabledReason: true,
    },
  });
  if (!inv) throw new AppError("NOT_FOUND");
  return inv;
}

const audit = (
  actorId: string,
  action: string,
  targetId: string,
  extra: Omit<
    Parameters<typeof recordAudit>[1],
    "actorId" | "action" | "targetType" | "targetId"
  > = {},
) =>
  prisma.$transaction((tx) =>
    recordAudit(tx, { actorId, action, targetType: "invitation", targetId, ...extra }),
  );

/** sites.takedown: disable a site (guests see "unavailable") with a reason. */
export async function takeDownSite(ctx: Ctx, input: { id: string; reason: string }) {
  await assertPermission(ctx, "sites.takedown");
  const inv = await findSite(input.id);
  if (inv.disabledAt) return { ok: true };
  await prisma.$transaction(async (tx) => {
    await tx.invitation.update({
      where: { id: inv.id },
      data: { disabledAt: new Date(), disabledReason: input.reason },
    });
    await recordAudit(tx, {
      actorId: ctx.userId,
      action: "site.taken_down",
      targetType: "invitation",
      targetId: inv.id,
      reason: input.reason,
    });
  });
  invalidatePublic(inv.slug);
  logEvent("invitation.disabled", { actorId: ctx.userId, invitationId: inv.id });
  return { ok: true };
}

/** sites.takedown: bring a taken-down site back. */
export async function restoreSite(ctx: Ctx, input: { id: string }) {
  await assertPermission(ctx, "sites.takedown");
  const inv = await findSite(input.id);
  if (!inv.disabledAt) return { ok: true };
  await prisma.$transaction(async (tx) => {
    await tx.invitation.update({
      where: { id: inv.id },
      data: { disabledAt: null, disabledReason: null },
    });
    await recordAudit(tx, {
      actorId: ctx.userId,
      action: "site.restored",
      targetType: "invitation",
      targetId: inv.id,
      before: { disabledReason: inv.disabledReason },
    });
  });
  invalidatePublic(inv.slug);
  return { ok: true };
}

/** sites.publish: unpublish on the owner's behalf. */
export async function unpublishSite(ctx: Ctx, input: { id: string }) {
  await assertPermission(ctx, "sites.publish");
  const inv = await findSite(input.id);
  const res = await publishing.unpublishInvitation({ userId: inv.ownerId }, { id: inv.id });
  await audit(ctx.userId, "site.unpublished", inv.id);
  return res;
}

/** sites.publish: publish the owner's latest draft on their behalf. */
export async function publishSite(ctx: Ctx, input: { id: string }) {
  await assertPermission(ctx, "sites.publish");
  const inv = await findSite(input.id);
  const res = await publishing.publishInvitation({ userId: inv.ownerId }, { id: inv.id });
  await audit(ctx.userId, "site.published", inv.id);
  return res;
}

/** sites.settings: change a site's title. */
export async function renameSite(ctx: Ctx, input: { id: string; title: string }) {
  await assertPermission(ctx, "sites.settings");
  const inv = await findSite(input.id);
  const res = await invitations.updateTitle({ userId: inv.ownerId }, input);
  await audit(ctx.userId, "site.title_changed", inv.id, {
    before: { title: inv.title },
    after: { title: res.title },
  });
  return res;
}

/** sites.settings: change a site's link (old links stop working). */
export async function changeSiteSlug(ctx: Ctx, input: { id: string; slug: string }) {
  await assertPermission(ctx, "sites.settings");
  const inv = await findSite(input.id);
  const res = await invitations.changeSlug({ userId: inv.ownerId }, input);
  await audit(ctx.userId, "site.link_changed", inv.id, {
    before: { slug: inv.slug },
    after: { slug: res.slug },
  });
  return res;
}

/** sites.delete: permanently delete an invitation (type its link to confirm). */
export async function deleteSite(ctx: Ctx, input: { id: string; confirmSlug: string }) {
  await assertPermission(ctx, "sites.delete");
  const inv = await findSite(input.id);
  if (input.confirmSlug.trim() !== inv.slug) {
    throw new AppError("VALIDATION", "Type the invitation link exactly to confirm.", {
      confirmSlug: ["Doesn't match"],
    });
  }
  await prisma.$transaction(async (tx) => {
    await tx.mediaAsset.updateMany({
      where: { invitationId: inv.id },
      data: { deletedAt: new Date() },
    });
    await tx.invitation.delete({ where: { id: inv.id } });
    await recordAudit(tx, {
      actorId: ctx.userId,
      action: "site.deleted",
      targetType: "invitation",
      targetId: inv.id,
      before: { slug: inv.slug, title: inv.title, ownerId: inv.ownerId },
    });
  });
  invalidatePublic(inv.slug);
  logEvent("invitation.deleted", { actorId: ctx.userId, invitationId: inv.id });
  return { ok: true };
}
