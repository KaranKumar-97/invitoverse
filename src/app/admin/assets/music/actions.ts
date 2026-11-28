"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { runAction } from "@/server/actions/define";
import * as svc from "@/server/services/admin-music";

// Each service checks assets.music (src/server/services/admin-music.ts).

const Id = z.string().min(1).max(60);
const Licence = z.enum(["OWNED", "LICENSED", "ROYALTY_FREE", "UNLICENSED"]);
const Details = {
  title: z.string().trim().min(1, "Add a title").max(80),
  artist: z.string().trim().max(80).nullable(),
  mood: z.string().trim().max(60),
  licence: Licence,
  licenceNote: z.string().trim().max(300).nullable(),
};
const refresh = () => {
  revalidatePath("/admin/assets/music");
  revalidatePath("/admin/audit");
};

const UpdateInput = z.object({ id: Id, ...Details });
const ActiveInput = z.object({ id: Id, isActive: z.boolean() });
const MoveInput = z.object({ id: Id, direction: z.enum(["up", "down"]) });
const RetireInput = z.object({ id: Id, replacedBy: Id });
const IdInput = z.object({ id: Id });
const DefaultInput = z.object({ slug: z.string().min(1).max(60), trackId: Id.nullable() });
const SignInput = z.object({ mimeType: z.string().max(60), bytes: z.number().int().positive() });
const ConfirmInput = z.object({
  key: z.string().min(1).max(300),
  durationSec: z.number().min(0).max(1200),
  ...Details,
});

export async function updateTrackAction(input: z.input<typeof UpdateInput>) {
  return runAction(UpdateInput, input, async (ctx, d) => {
    const r = await svc.updateTrack(ctx, d);
    refresh();
    return r;
  });
}
export async function setTrackActiveAction(input: z.input<typeof ActiveInput>) {
  return runAction(ActiveInput, input, async (ctx, d) => {
    const r = await svc.setTrackActive(ctx, d);
    refresh();
    return r;
  });
}
export async function moveTrackAction(input: z.input<typeof MoveInput>) {
  return runAction(MoveInput, input, async (ctx, d) => {
    const r = await svc.moveTrack(ctx, d);
    refresh();
    return r;
  });
}
export async function retireTrackAction(input: z.input<typeof RetireInput>) {
  return runAction(RetireInput, input, async (ctx, d) => {
    const r = await svc.retireTrack(ctx, d);
    refresh();
    return r;
  });
}
export async function restoreTrackAction(input: z.input<typeof IdInput>) {
  return runAction(IdInput, input, async (ctx, d) => {
    const r = await svc.restoreTrack(ctx, d);
    refresh();
    return r;
  });
}
export async function setTemplateDefaultTrackAction(input: z.input<typeof DefaultInput>) {
  return runAction(DefaultInput, input, async (ctx, d) => {
    const r = await svc.setTemplateDefaultTrack(ctx, d);
    refresh();
    return r;
  });
}
export async function signTrackUploadAction(input: z.input<typeof SignInput>) {
  return runAction(SignInput, input, (ctx, d) => svc.signTrackUpload(ctx, d));
}
export async function confirmTrackUploadAction(input: z.input<typeof ConfirmInput>) {
  return runAction(ConfirmInput, input, async (ctx, d) => {
    const r = await svc.confirmTrackUpload(ctx, d);
    refresh();
    return r;
  });
}
