import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { AppError } from "@/lib/action-result";
import { prisma } from "@/server/db/prisma";
import * as svc from "@/server/services/admin-templates";
import { canUseTemplate } from "@/server/services/entitlements";
import { listAvailableTemplates } from "@/server/services/templates";
import { TEMPLATE_SLUGS } from "@/templates/registry";
import { makeUser, resetDb } from "./helpers";

async function expectCode(p: Promise<unknown>, code: string) {
  await expect(p).rejects.toSatisfy((e: unknown) => e instanceof AppError && e.code === code);
}

let superCtx: { userId: string };
let adminCtx: { userId: string };
const slug = "mandir";

beforeEach(async () => {
  await resetDb();
  // Template rows as the seed creates them.
  for (const [i, s] of TEMPLATE_SLUGS.entries()) {
    await prisma.template.upsert({
      where: { slug: s },
      create: { slug: s, name: s, category: "ROYAL", sortOrder: (i + 1) * 10 },
      update: {
        isActive: true,
        retiredAt: null,
        tier: "FREE",
        pricePaise: null,
        sortOrder: (i + 1) * 10,
      },
    });
  }
  const s = await makeUser("Super");
  const a = await makeUser("Admin");
  await prisma.user.update({ where: { id: s.id }, data: { role: "SUPERADMIN" } });
  await prisma.user.update({ where: { id: a.id }, data: { role: "ADMIN" } });
  superCtx = { userId: s.id };
  adminCtx = { userId: a.id };
});

afterAll(async () => {
  await resetDb();
  await prisma.$disconnect();
});

describe("admin templates", () => {
  it("lets Admins list but not change templates", async () => {
    expect((await svc.listTemplatesAdmin(adminCtx)).length).toBe(TEMPLATE_SLUGS.length);
    await expectCode(svc.setTemplateVisibility(adminCtx, { slug, isActive: false }), "NOT_FOUND");
    await expectCode(
      svc.setTemplatePrice(adminCtx, { slug, tier: "PREMIUM", pricePaise: 49900 }),
      "NOT_FOUND",
    );
  });

  it("hiding removes a template from the picker and blocks new use; audited", async () => {
    await svc.setTemplateVisibility(superCtx, { slug, isActive: false });
    expect((await listAvailableTemplates()).some((t) => t.slug === slug)).toBe(false);
    expect(await canUseTemplate(superCtx.userId, slug)).toBe(false);
    const log = await prisma.adminAuditLog.findFirst({ where: { targetId: slug } });
    expect(log?.action).toBe("template.hidden");
  });

  it("validates and stores prices in paise", async () => {
    await expectCode(
      svc.setTemplatePrice(superCtx, { slug, tier: "PREMIUM", pricePaise: 0 }),
      "VALIDATION",
    );
    await svc.setTemplatePrice(superCtx, { slug, tier: "PREMIUM", pricePaise: 49900 });
    let t = await prisma.template.findUniqueOrThrow({ where: { slug } });
    expect([t.tier, t.pricePaise]).toEqual(["PREMIUM", 49900]);
    await svc.setTemplatePrice(superCtx, { slug, tier: "FREE", pricePaise: 49900 });
    t = await prisma.template.findUniqueOrThrow({ where: { slug } });
    expect([t.tier, t.pricePaise]).toEqual(["FREE", null]);
  });

  it("an Admin granted only templates.price can change prices but not visibility", async () => {
    await prisma.adminPermission.create({
      data: {
        userId: adminCtx.userId,
        key: "templates.price",
        allowed: true,
        grantedBy: superCtx.userId,
      },
    });
    await svc.setTemplatePrice(adminCtx, { slug, tier: "PREMIUM", pricePaise: 29900 });
    await expectCode(svc.setTemplateVisibility(adminCtx, { slug, isActive: false }), "NOT_FOUND");
  });

  it("retire hides and blocks showing until restored", async () => {
    await svc.retireTemplate(superCtx, { slug, reason: "Art rights" });
    let t = await prisma.template.findUniqueOrThrow({ where: { slug } });
    expect(t.retiredAt).not.toBeNull();
    expect(t.isActive).toBe(false);
    await expectCode(svc.setTemplateVisibility(superCtx, { slug, isActive: true }), "VALIDATION");
    await svc.restoreTemplate(superCtx, { slug });
    await svc.setTemplateVisibility(superCtx, { slug, isActive: true });
    t = await prisma.template.findUniqueOrThrow({ where: { slug } });
    expect([t.retiredAt, t.isActive]).toEqual([null, true]);
  });

  it("moves a template up one place", async () => {
    const before = (await svc.listTemplatesAdmin(superCtx)).map((r) => r.slug);
    const target = before[2]!;
    await svc.moveTemplate(superCtx, { slug: target, direction: "up" });
    const after = (await svc.listTemplatesAdmin(superCtx)).map((r) => r.slug);
    expect(after[1]).toBe(target);
    expect(after[2]).toBe(before[1]);
  });
});
