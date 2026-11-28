import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { AppError } from "@/lib/action-result";
import { prisma } from "@/server/db/prisma";
import * as svc from "@/server/services/admin-sites";
import { makeUser, resetDb } from "./helpers";

async function expectCode(p: Promise<unknown>, code: string) {
  await expect(p).rejects.toSatisfy((e: unknown) => e instanceof AppError && e.code === code);
}

let superCtx: { userId: string };
let adminCtx: { userId: string };
let siteId: string;
const slug = "asha-dev-site";

beforeEach(async () => {
  await resetDb();
  await prisma.template.upsert({
    where: { slug: "royal-heritage" },
    create: { slug: "royal-heritage", name: "Royal Heritage", category: "ROYAL" },
    update: {},
  });
  const s = await makeUser("Super");
  const a = await makeUser("Admin");
  const owner = await makeUser("Owner");
  await prisma.user.update({ where: { id: s.id }, data: { role: "SUPERADMIN" } });
  await prisma.user.update({ where: { id: a.id }, data: { role: "ADMIN" } });
  superCtx = { userId: s.id };
  adminCtx = { userId: a.id };
  const inv = await prisma.invitation.create({
    data: {
      ownerId: owner.id,
      templateSlug: "royal-heritage",
      slug,
      title: "Asha & Dev",
      status: "PUBLISHED",
      draftContent: {},
      draftDesign: {},
      publishedVersion: 1,
      publishedAt: new Date(),
    },
  });
  siteId = inv.id;
});

afterAll(async () => {
  await resetDb();
  await prisma.$disconnect();
});

describe("admin sites", () => {
  it("lists sites for Admins (view) and searches by owner email", async () => {
    const all = await svc.listSites(adminCtx);
    expect(all.sites.map((s) => s.slug)).toEqual([slug]);
    expect(all.sites[0]!.state).toBe("live");
    expect((await svc.listSites(adminCtx, { q: "owner-" })).total).toBe(1);
    expect((await svc.listSites(adminCtx, { q: "nomatch" })).total).toBe(0);
  });

  it("blocks Admins from changing sites by default", async () => {
    await expectCode(svc.takeDownSite(adminCtx, { id: siteId, reason: "spam" }), "NOT_FOUND");
    await expectCode(svc.renameSite(adminCtx, { id: siteId, title: "X" }), "NOT_FOUND");
    await expectCode(svc.deleteSite(adminCtx, { id: siteId, confirmSlug: slug }), "NOT_FOUND");
  });

  it("takes a site down and restores it, with audit rows", async () => {
    await svc.takeDownSite(superCtx, { id: siteId, reason: "Reported content" });
    expect((await svc.listSites(superCtx, { status: "down" })).total).toBe(1);
    await svc.restoreSite(superCtx, { id: siteId });
    expect((await svc.listSites(superCtx, { status: "live" })).total).toBe(1);
    const actions = (await prisma.adminAuditLog.findMany({ orderBy: { createdAt: "asc" } })).map(
      (r) => r.action,
    );
    expect(actions).toEqual(["site.taken_down", "site.restored"]);
  });

  it("renames, changes the link and unpublishes on the owner's behalf", async () => {
    await svc.renameSite(superCtx, { id: siteId, title: "Asha weds Dev" });
    await svc.changeSiteSlug(superCtx, { id: siteId, slug: "asha-weds-dev" });
    await svc.unpublishSite(superCtx, { id: siteId });
    const inv = await prisma.invitation.findUniqueOrThrow({ where: { id: siteId } });
    expect([inv.title, inv.slug, inv.status]).toEqual(["Asha weds Dev", "asha-weds-dev", "DRAFT"]);
    expect((await svc.listSites(superCtx, { status: "unpublished" })).total).toBe(1);
  });

  it("deletes only with the link typed", async () => {
    await expectCode(svc.deleteSite(superCtx, { id: siteId, confirmSlug: "nope" }), "VALIDATION");
    await svc.deleteSite(superCtx, { id: siteId, confirmSlug: slug });
    expect(await prisma.invitation.count()).toBe(0);
    expect(await prisma.adminAuditLog.count({ where: { action: "site.deleted" } })).toBe(1);
  });
});
