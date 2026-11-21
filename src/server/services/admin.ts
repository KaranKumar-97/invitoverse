import "server-only";
import { prisma } from "@/server/db/prisma";

export type PlatformStats = {
  users: { total: number; last7d: number };
  invitations: { draft: number; published: number; archived: number; disabled: number };
  guests: { total: number; opened: number };
  opens: number;
  media: { assets: number; bytes: number };
  recentPublishes: Array<{ slug: string; templateSlug: string; publishedAt: string }>;
};

/**
 * Aggregate platform numbers for the internal /admin page. Callers must have checked the
 * ADMIN role (requireAdmin). Returns counts only — no emails, names or guest data.
 */
export async function getPlatformStats(now = new Date()): Promise<PlatformStats> {
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000);
  const [users, newUsers, byStatus, disabled, guests, opened, opens, media, recent] =
    await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: null, createdAt: { gte: weekAgo } } }),
      prisma.invitation.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.invitation.count({ where: { disabledAt: { not: null } } }),
      prisma.guest.count(),
      prisma.guest.count({ where: { status: "OPENED" } }),
      prisma.invitation.aggregate({ _sum: { openCount: true } }),
      prisma.mediaAsset.aggregate({
        where: { deletedAt: null },
        _count: { _all: true },
        _sum: { bytes: true },
      }),
      prisma.invitation.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take: 10,
        select: { slug: true, publishedTemplateSlug: true, templateSlug: true, publishedAt: true },
      }),
    ]);
  const count = (s: string) => byStatus.find((r) => r.status === s)?._count._all ?? 0;
  return {
    users: { total: users, last7d: newUsers },
    invitations: {
      draft: count("DRAFT"),
      published: count("PUBLISHED"),
      archived: count("ARCHIVED"),
      disabled,
    },
    guests: { total: guests, opened },
    opens: opens._sum.openCount ?? 0,
    media: { assets: media._count._all, bytes: media._sum.bytes ?? 0 },
    recentPublishes: recent.map((r) => ({
      slug: r.slug,
      templateSlug: r.publishedTemplateSlug ?? r.templateSlug,
      publishedAt: r.publishedAt?.toISOString() ?? "",
    })),
  };
}
