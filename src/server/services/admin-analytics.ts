import "server-only";
import { AppError } from "@/lib/action-result";
import { prisma } from "@/server/db/prisma";
import { isTemplateSlug, templateManifests } from "@/templates/registry";
import { assertPermission } from "./admin-access";
import type { Ctx } from "./context";

/** Platform and per-user analytics for admins (docs/19 §4.4). Counts only, no personal data. */

export const RANGES = [7, 30, 90] as const;
export type RangeDays = (typeof RANGES)[number];
export type DayPoint = { date: string; value: number };

const DAY = 86_400_000;
const isoDay = (d: Date) => d.toISOString().slice(0, 10);

/** Every day in the range (oldest first), filled with zeros where there's no data. */
function series(days: number, now: Date, rows: Array<{ day: string; n: number }>): DayPoint[] {
  const byDay = new Map(rows.map((r) => [r.day, r.n]));
  const out: DayPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = isoDay(new Date(now.getTime() - i * DAY));
    out.push({ date, value: byDay.get(date) ?? 0 });
  }
  return out;
}

const sum = (s: DayPoint[]) => s.reduce((a, p) => a + p.value, 0);

export async function getPlatformAnalytics(ctx: Ctx, days: RangeDays, now = new Date()) {
  await assertPermission(ctx, "analytics.view");
  const since = new Date(now.getTime() - (days - 1) * DAY);
  since.setUTCHours(0, 0, 0, 0);
  const prevSince = new Date(since.getTime() - days * DAY);

  const daily = (table: "User" | "Invitation", column: "createdAt" | "publishedAt") =>
    prisma.$queryRawUnsafe<Array<{ day: string; n: number }>>(
      `SELECT to_char(date_trunc('day', "${column}"), 'YYYY-MM-DD') AS day, COUNT(*)::int AS n
       FROM "${table}" WHERE "${column}" >= $1 ${table === "User" ? `AND "deletedAt" IS NULL` : ""}
       GROUP BY 1`,
      since,
    );

  const [signups, created, published, opens, prevSignups, prevOpens, funnel, byTemplate, music] =
    await Promise.all([
      daily("User", "createdAt"),
      daily("Invitation", "createdAt"),
      daily("Invitation", "publishedAt"),
      prisma.$queryRaw<Array<{ day: string; n: number }>>`
        SELECT to_char("date", 'YYYY-MM-DD') AS day, SUM("opens")::int AS n
        FROM "InvitationDailyStat" WHERE "date" >= ${since}::date GROUP BY 1`,
      prisma.user.count({ where: { deletedAt: null, createdAt: { gte: prevSince, lt: since } } }),
      prisma.invitationDailyStat.aggregate({
        where: { date: { gte: prevSince, lt: since } },
        _sum: { opens: true },
      }),
      // Funnel for accounts that signed up in the range.
      prisma.$queryRaw<
        Array<{
          signed: number;
          created: number;
          published: number;
          shared: number;
          opened: number;
        }>
      >`
        WITH cohort AS (
          SELECT "id" FROM "User" WHERE "createdAt" >= ${since} AND "deletedAt" IS NULL
        )
        SELECT
          (SELECT COUNT(*) FROM cohort)::int AS signed,
          (SELECT COUNT(DISTINCT i."ownerId") FROM "Invitation" i JOIN cohort c ON c."id" = i."ownerId")::int AS created,
          (SELECT COUNT(DISTINCT i."ownerId") FROM "Invitation" i JOIN cohort c ON c."id" = i."ownerId"
             WHERE i."publishedVersion" > 0)::int AS published,
          (SELECT COUNT(DISTINCT i."ownerId") FROM "Invitation" i JOIN cohort c ON c."id" = i."ownerId"
             JOIN "Guest" g ON g."invitationId" = i."id")::int AS shared,
          (SELECT COUNT(DISTINCT i."ownerId") FROM "Invitation" i JOIN cohort c ON c."id" = i."ownerId"
             JOIN "Guest" g ON g."invitationId" = i."id" WHERE g."status" = 'OPENED')::int AS opened`,
      prisma.invitation.groupBy({
        by: ["templateSlug", "status"],
        where: { createdAt: { gte: since } },
        _count: { _all: true },
      }),
      prisma.$queryRaw<Array<{ trackId: string; n: number }>>`
        SELECT "draftContent"->'media'->'music'->>'trackId' AS "trackId", COUNT(*)::int AS n
        FROM "Invitation"
        WHERE "createdAt" >= ${since} AND "draftContent"->'media'->'music'->>'type' = 'LIBRARY'
        GROUP BY 1 ORDER BY n DESC LIMIT 8`,
    ]);

  const guestTotals = await prisma.guest.groupBy({
    by: ["status"],
    where: { createdAt: { gte: since } },
    _count: { _all: true },
  });
  const guestsAdded = guestTotals.reduce((a, g) => a + g._count._all, 0);
  const guestsOpened = guestTotals.find((g) => g.status === "OPENED")?._count._all ?? 0;

  const signupSeries = series(days, now, signups);
  const openSeries = series(days, now, opens);
  const templates = new Map<string, { created: number; published: number }>();
  for (const r of byTemplate) {
    const t = templates.get(r.templateSlug) ?? { created: 0, published: 0 };
    t.created += r._count._all;
    if (r.status === "PUBLISHED") t.published += r._count._all;
    templates.set(r.templateSlug, t);
  }
  const tracks = await prisma.musicTrack.findMany({
    where: { id: { in: music.map((m) => m.trackId) } },
    select: { id: true, title: true },
  });

  return {
    days,
    signups: {
      series: signupSeries,
      total: sum(signupSeries),
      previous: prevSignups,
    },
    created: series(days, now, created),
    published: series(days, now, published),
    opens: { series: openSeries, total: sum(openSeries), previous: prevOpens._sum.opens ?? 0 },
    guests: { added: guestsAdded, opened: guestsOpened },
    funnel: funnel[0] ?? { signed: 0, created: 0, published: 0, shared: 0, opened: 0 },
    templates: [...templates.entries()]
      .map(([slug, v]) => ({
        slug,
        name: isTemplateSlug(slug)
          ? templateManifests[slug as keyof typeof templateManifests].name
          : slug,
        ...v,
      }))
      .sort((a, b) => b.created - a.created),
    music: music.map((m) => ({
      id: m.trackId,
      title: tracks.find((t) => t.id === m.trackId)?.title ?? m.trackId,
      count: m.n,
    })),
  };
}

/** One user's invitations with opens per day over the last 30 days and guest open rates. */
export async function getUserAnalytics(ctx: Ctx, userId: string, now = new Date()) {
  await assertPermission(ctx, "analytics.view");
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!u) throw new AppError("NOT_FOUND");
  const since = new Date(now.getTime() - 29 * DAY);
  since.setUTCHours(0, 0, 0, 0);
  const [rows, guests] = await Promise.all([
    prisma.$queryRaw<Array<{ day: string; n: number }>>`
      SELECT to_char(s."date", 'YYYY-MM-DD') AS day, SUM(s."opens")::int AS n
      FROM "InvitationDailyStat" s JOIN "Invitation" i ON i."id" = s."invitationId"
      WHERE i."ownerId" = ${userId} AND s."date" >= ${since}::date GROUP BY 1`,
    prisma.guest.groupBy({
      by: ["status"],
      where: { invitation: { ownerId: userId } },
      _count: { _all: true },
    }),
  ]);
  const opens = series(30, now, rows);
  const total = guests.reduce((a, g) => a + g._count._all, 0);
  const opened = guests.find((g) => g.status === "OPENED")?._count._all ?? 0;
  return { opens, totalOpens: sum(opens), guests: { total, opened } };
}
