"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { runAction } from "@/server/actions/define";
import * as svc from "@/server/services/admin-art";

// Each service checks assets.template_art (src/server/services/admin-art.ts).

const Slot = { slug: z.string().min(1).max(60), file: z.string().min(1).max(80) };
const SignInput = z.object({
  ...Slot,
  mimeType: z.string().max(60),
  bytes: z.number().int().positive(),
});
const ConfirmInput = z.object({
  ...Slot,
  key: z.string().min(1).max(300),
  licence: z.enum(["OWNED", "LICENSED", "ROYALTY_FREE", "UNLICENSED"]),
});
const ResetInput = z.object(Slot);
const refresh = () => {
  revalidatePath("/admin/assets/templates");
  revalidatePath("/admin/audit");
};

export async function signArtUploadAction(input: z.input<typeof SignInput>) {
  return runAction(SignInput, input, (ctx, d) => svc.signArtUpload(ctx, d));
}
export async function confirmArtUploadAction(input: z.input<typeof ConfirmInput>) {
  return runAction(ConfirmInput, input, async (ctx, d) => {
    const r = await svc.confirmArtUpload(ctx, d);
    refresh();
    return r;
  });
}
export async function resetArtAction(input: z.input<typeof ResetInput>) {
  return runAction(ResetInput, input, async (ctx, d) => {
    const r = await svc.resetArt(ctx, d);
    refresh();
    return r;
  });
}
