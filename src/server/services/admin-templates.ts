import "server-only";
import { AppError } from "@/lib/action-result";
import { prisma } from "@/server/db/prisma";
import { isTemplateSlug, templateManifests, TEMPLATE_SLUGS } from "@/templates/registry";
import { assertPermission, recordAudit } from "./admin-access";
import { invalidateCatalogue } from "./catalogue";
import type { Ctx } from "./context";

export type AdminTemplateRow = {
  slug: string;
  name: string;
  category: string;
  styleLabel: string;
  isActive: boolean;
  retiredAt: string | null;
  isNew: boolean;
  tier: "FREE" | "PREMIUM";
  pricePaise: number | null;
  sortOrder: number;
  counts: { draft: number; published: number; archived: number };
};

/** templates.view: every template that has code, in catalogue order, with usage counts. */
export async function listTemplatesAdmin(ctx: Ctx): Promise<AdminTemplateRow[]> {
  await assertPermission(ctx, "templates.view");
  const [rows, usage] = await Promise.all([
    prisma.template.findMany({
      where: { slug: { in: TEMPLATE_SLUGS } },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.invitation.groupBy({ by: ["templateSlug", "status"], _count: { _all: true } }),
  ]);
  const count = (slug: string, status: string) =>
    usage.find((u) => u.templateSlug === slug && u.status === status)?._count._all ?? 0;
  return rows
    .filter((r) => isTemplateSlug(r.slug))
    .map((r) => {
      const m = templateManifests[r.slug as keyof typeof templateManifests];
      return {
        slug: r.slug,
        name: m.name,
        category: m.category,
        styleLabel: m.styleLabel,
        isActive: r.isActive,
        retiredAt: r.retiredAt?.toISOString() ?? null,
        isNew: r.isNew,
        tier: r.tier,
        pricePaise: r.pricePaise,
        sortOrder: r.sortOrder,
        counts: {
          draft: count(r.slug, "DRAFT"),
          published: count(r.slug, "PUBLISHED"),
          archived: count(r.slug, "ARCHIVED"),
        },
      };
    });
}

async function findTemplate(slug: string) {
  const t = await prisma.template.findUnique({ where: { slug } });
  if (!t || !isTemplateSlug(slug)) throw new AppError("NOT_FOUND");
  return t;
}

/** templates.visibility: show or hide (a retired template can't be shown until restored). */
export async function setTemplateVisibility(ctx: Ctx, input: { slug: string; isActive: boolean }) {
  await assertPermission(ctx, "templates.visibility");
  const t = await findTemplate(input.slug);
  if (input.isActive && t.retiredAt) {
    throw new AppError("VALIDATION", "Restore this template before showing it.");
  }
  if (t.isActive === input.isActive) return { ok: true };
  await prisma.$transaction(async (tx) => {
    await tx.template.update({ where: { slug: t.slug }, data: { isActive: input.isActive } });
    await recordAudit(tx, {
      actorId: ctx.userId,
      action: input.isActive ? "template.shown" : "template.hidden",
      targetType: "template",
      targetId: t.slug,
      before: { isActive: t.isActive },
      after: { isActive: input.isActive },
    });
  });
  invalidateCatalogue();
  return { ok: true };
}

/** templates.visibility: the New badge. */
export async function setTemplateNew(ctx: Ctx, input: { slug: string; isNew: boolean }) {
  await assertPermission(ctx, "templates.visibility");
  const t = await findTemplate(input.slug);
  await prisma.$transaction(async (tx) => {
    await tx.template.update({ where: { slug: t.slug }, data: { isNew: input.isNew } });
    await recordAudit(tx, {
      actorId: ctx.userId,
      action: "template.new_badge",
      targetType: "template",
      targetId: t.slug,
      before: { isNew: t.isNew },
      after: { isNew: input.isNew },
    });
  });
  invalidateCatalogue();
  return { ok: true };
}

/** templates.visibility: move one place up or down (swaps sortOrder with its neighbour). */
export async function moveTemplate(ctx: Ctx, input: { slug: string; direction: "up" | "down" }) {
  await assertPermission(ctx, "templates.visibility");
  const rows = await prisma.template.findMany({
    where: { slug: { in: TEMPLATE_SLUGS } },
    orderBy: { sortOrder: "asc" },
    select: { slug: true, sortOrder: true },
  });
  const i = rows.findIndex((r) => r.slug === input.slug);
  if (i < 0) throw new AppError("NOT_FOUND");
  const j = input.direction === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= rows.length) return { ok: true };
  // Renumber so equal sortOrders never stall a move, then swap the two.
  const order = rows.map((r) => r.slug);
  [order[i], order[j]] = [order[j]!, order[i]!];
  await prisma.$transaction(async (tx) => {
    for (const [n, slug] of order.entries()) {
      await tx.template.update({ where: { slug }, data: { sortOrder: (n + 1) * 10 } });
    }
    await recordAudit(tx, {
      actorId: ctx.userId,
      action: "template.reordered",
      targetType: "template",
      targetId: input.slug,
      after: { direction: input.direction, position: j + 1 },
    });
  });
  invalidateCatalogue();
  return { ok: true };
}

/**
 * templates.price: Free, or Premium with a price in paise (₹1–₹1,00,000). Stored only; charging
 * starts with docs/17 payments.
 */
export async function setTemplatePrice(
  ctx: Ctx,
  input: { slug: string; tier: "FREE" | "PREMIUM"; pricePaise: number | null },
) {
  await assertPermission(ctx, "templates.price");
  const t = await findTemplate(input.slug);
  const pricePaise = input.tier === "FREE" ? null : input.pricePaise;
  if (input.tier === "PREMIUM") {
    if (
      !pricePaise ||
      !Number.isInteger(pricePaise) ||
      pricePaise < 100 ||
      pricePaise > 10_000_000
    ) {
      throw new AppError("VALIDATION", "Enter a price between ₹1 and ₹1,00,000.", {
        price: ["Enter a price between ₹1 and ₹1,00,000"],
      });
    }
  }
  await prisma.$transaction(async (tx) => {
    await tx.template.update({ where: { slug: t.slug }, data: { tier: input.tier, pricePaise } });
    await recordAudit(tx, {
      actorId: ctx.userId,
      action: "template.price_changed",
      targetType: "template",
      targetId: t.slug,
      before: { tier: t.tier, pricePaise: t.pricePaise },
      after: { tier: input.tier, pricePaise },
    });
  });
  invalidateCatalogue();
  return { ok: true };
}

/** templates.retire: hide everywhere and block new use; existing invitations keep rendering. */
export async function retireTemplate(ctx: Ctx, input: { slug: string; reason: string }) {
  await assertPermission(ctx, "templates.retire");
  const t = await findTemplate(input.slug);
  if (t.retiredAt) return { ok: true };
  await prisma.$transaction(async (tx) => {
    await tx.template.update({
      where: { slug: t.slug },
      data: { retiredAt: new Date(), isActive: false },
    });
    await recordAudit(tx, {
      actorId: ctx.userId,
      action: "template.retired",
      targetType: "template",
      targetId: t.slug,
      before: { isActive: t.isActive },
      reason: input.reason,
    });
  });
  invalidateCatalogue();
  return { ok: true };
}

/** templates.retire: undo a retirement (the template stays hidden until shown again). */
export async function restoreTemplate(ctx: Ctx, input: { slug: string }) {
  await assertPermission(ctx, "templates.retire");
  const t = await findTemplate(input.slug);
  if (!t.retiredAt) return { ok: true };
  await prisma.$transaction(async (tx) => {
    await tx.template.update({ where: { slug: t.slug }, data: { retiredAt: null } });
    await recordAudit(tx, {
      actorId: ctx.userId,
      action: "template.restored",
      targetType: "template",
      targetId: t.slug,
    });
  });
  invalidateCatalogue();
  return { ok: true };
}
