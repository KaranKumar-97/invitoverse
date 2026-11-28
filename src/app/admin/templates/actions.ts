"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { runAction } from "@/server/actions/define";
import * as svc from "@/server/services/admin-templates";

// Each service checks the caller's permission (templates.visibility / .price / .retire).

const Slug = z.string().min(1).max(60);
const refresh = () => {
  revalidatePath("/admin/templates");
  revalidatePath("/admin/audit");
};

const VisibilityInput = z.object({ slug: Slug, isActive: z.boolean() });
const NewInput = z.object({ slug: Slug, isNew: z.boolean() });
const MoveInput = z.object({ slug: Slug, direction: z.enum(["up", "down"]) });
const PriceInput = z.object({
  slug: Slug,
  tier: z.enum(["FREE", "PREMIUM"]),
  priceRupees: z.number().min(0).max(100_000).nullable(),
});
const RetireInput = z.object({
  slug: Slug,
  reason: z.string().trim().min(3, "Add a reason").max(300),
});
const SlugInput = z.object({ slug: Slug });

export async function setTemplateVisibilityAction(input: z.input<typeof VisibilityInput>) {
  return runAction(VisibilityInput, input, async (ctx, d) => {
    const r = await svc.setTemplateVisibility(ctx, d);
    refresh();
    return r;
  });
}

export async function setTemplateNewAction(input: z.input<typeof NewInput>) {
  return runAction(NewInput, input, async (ctx, d) => {
    const r = await svc.setTemplateNew(ctx, d);
    refresh();
    return r;
  });
}

export async function moveTemplateAction(input: z.input<typeof MoveInput>) {
  return runAction(MoveInput, input, async (ctx, d) => {
    const r = await svc.moveTemplate(ctx, d);
    refresh();
    return r;
  });
}

export async function setTemplatePriceAction(input: z.input<typeof PriceInput>) {
  return runAction(PriceInput, input, async (ctx, d) => {
    const pricePaise = d.priceRupees === null ? null : Math.round(d.priceRupees * 100);
    const r = await svc.setTemplatePrice(ctx, { slug: d.slug, tier: d.tier, pricePaise });
    refresh();
    return r;
  });
}

export async function retireTemplateAction(input: z.input<typeof RetireInput>) {
  return runAction(RetireInput, input, async (ctx, d) => {
    const r = await svc.retireTemplate(ctx, d);
    refresh();
    return r;
  });
}

export async function restoreTemplateAction(input: z.input<typeof SlugInput>) {
  return runAction(SlugInput, input, async (ctx, d) => {
    const r = await svc.restoreTemplate(ctx, d);
    refresh();
    return r;
  });
}
