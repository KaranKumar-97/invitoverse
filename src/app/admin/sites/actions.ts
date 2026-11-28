"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { runAction } from "@/server/actions/define";
import * as svc from "@/server/services/admin-sites";

// Each service checks the caller's permission (sites.publish / .settings / .takedown / .delete).

const Id = z.object({ id: z.string().min(1).max(40) });
const refresh = () => {
  revalidatePath("/admin/sites");
  revalidatePath("/admin/audit");
};
const wrap =
  <S extends z.ZodType, O>(schema: S, fn: (ctx: { userId: string }, d: z.infer<S>) => Promise<O>) =>
  (input: z.input<S>) =>
    runAction(schema, input, async (ctx, d) => {
      const r = await fn(ctx, d);
      refresh();
      return r;
    });

const Reason = Id.extend({ reason: z.string().trim().min(3, "Add a reason").max(300) });
const Title = Id.extend({ title: z.string().trim().min(1).max(120) });
const Slug = Id.extend({ slug: z.string().trim().toLowerCase().min(1).max(60) });
const Confirm = Id.extend({ confirmSlug: z.string().max(60) });

export async function takeDownSiteAction(input: z.input<typeof Reason>) {
  return wrap(Reason, svc.takeDownSite)(input);
}
export async function restoreSiteAction(input: z.input<typeof Id>) {
  return wrap(Id, svc.restoreSite)(input);
}
export async function unpublishSiteAction(input: z.input<typeof Id>) {
  return wrap(Id, svc.unpublishSite)(input);
}
export async function publishSiteAction(input: z.input<typeof Id>) {
  return wrap(Id, svc.publishSite)(input);
}
export async function renameSiteAction(input: z.input<typeof Title>) {
  return wrap(Title, svc.renameSite)(input);
}
export async function changeSiteSlugAction(input: z.input<typeof Slug>) {
  return wrap(Slug, svc.changeSiteSlug)(input);
}
export async function deleteSiteAction(input: z.input<typeof Confirm>) {
  return wrap(Confirm, svc.deleteSite)(input);
}
