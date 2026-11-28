import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { AppError } from "@/lib/action-result";
import { prisma } from "@/server/db/prisma";
import { getPlatformAnalytics, getUserAnalytics } from "@/server/services/admin-analytics";
import { recordGuestOpen, recordPublicOpen } from "@/server/services/public-invitations";
import { makeUser, resetDb } from "./helpers";

let adminCtx: { userId: string };
let ownerId: string;
const token = "A".repeat(22);

beforeEach(async () => {
  await resetDb();
  await prisma.template.upsert({
    where: { slug: "royal-heritage" },
    create: { slug: "royal-heritage", name: "Royal Heritage", category: "ROYAL" },
    update: {},
  });
  const a = await makeUser("Admin");
  await prisma.user.update({ where: { id: a.id }, data: { role: "ADMIN" } });
  adminCtx = { userId: a.id };
  ownerId = (await makeUser("Owner")).id;
  const inv = await prisma.invitation.create({
    data: {
      ownerId,
      templateSlug: "royal-heritage",
      slug: "stats-site",
      title: "Stats",
      status: "PUBLISHED",
      publishedVersion: 1,
      publishedAt: new Date(),
      draftContent: { media: { music: { type: "LIBRARY", trackId: "krishna-flute" } } },
      draftDesign: {},
    },
  });
  await prisma.guest.create({ data: { invitationId: inv.id, displayName: "G", token } });
});

afterAll(async () => {
  await resetDb();
  await prisma.$disconnect();
});

describe("analytics", () => {
  it("counts opens per day from the beacon", async () => {
    await recordPublicOpen("stats-site");
    await recordPublicOpen("stats-site");
    await recordGuestOpen("stats-site", token);
    const rows = await prisma.invitationDailyStat.findMany();
    expect(rows).toHaveLength(1);
    expect([rows[0]!.opens, rows[0]!.guestOpens]).toEqual([3, 1]);
  });

  it("reports platform totals, funnel and templates", async () => {
    await recordGuestOpen("stats-site", token);
    const a = await getPlatformAnalytics(adminCtx, 7);
    expect(a.signups.total).toBe(2);
    expect(a.opens.total).toBe(1);
    expect(a.funnel).toEqual({ signed: 2, created: 1, published: 1, shared: 1, opened: 1 });
    expect(a.templates[0]).toMatchObject({ slug: "royal-heritage", created: 1, published: 1 });
    expect(a.music[0]).toMatchObject({ id: "krishna-flute", count: 1 });
    expect(a.signups.series).toHaveLength(7);
  });

  it("reports per-user opens and guest open rate", async () => {
    await recordGuestOpen("stats-site", token);
    const u = await getUserAnalytics(adminCtx, ownerId);
    expect(u.totalOpens).toBe(1);
    expect(u.guests).toEqual({ total: 1, opened: 1 });
  });

  it("needs analytics.view", async () => {
    await prisma.adminPermission.create({
      data: { userId: adminCtx.userId, key: "analytics.view", allowed: false, grantedBy: ownerId },
    });
    await expect(getPlatformAnalytics(adminCtx, 7)).rejects.toBeInstanceOf(AppError);
  });
});
