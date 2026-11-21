"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { IsoDate } from "@/lib/invitation/schema";
import { runAction } from "@/server/actions/define";
import * as invitations from "@/server/services/invitations";

const Id = z.object({ id: z.string().min(1).max(40) });

const CreateInput = z.object({
  templateSlug: z.string().min(1).max(60),
  brideName: z.string().trim().min(1, "Required").max(40),
  groomName: z.string().trim().min(1, "Required").max(40),
  order: z.enum(["BRIDE_FIRST", "GROOM_FIRST"]),
  weddingDate: IsoDate,
  slug: z.string().trim().toLowerCase().max(48).optional(),
});

const CheckSlugInput = z.object({
  slug: z.string().max(60),
  excludeId: z.string().max(40).optional(),
  names: z.tuple([z.string().max(40), z.string().max(40)]).optional(),
  weddingDate: z.string().max(10).optional(),
});

const DeleteInput = Id.extend({ confirmSlug: z.string().max(60) });

function refresh() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/invitations");
}

export async function createInvitationAction(input: z.input<typeof CreateInput>) {
  return runAction(CreateInput, input, async (ctx, data) => {
    const res = await invitations.createInvitation(ctx, data);
    refresh();
    return res;
  });
}

export async function checkSlugAction(input: z.input<typeof CheckSlugInput>) {
  return runAction(CheckSlugInput, input, (ctx, data) => invitations.checkSlug(ctx, data));
}

export async function duplicateInvitationAction(input: z.input<typeof Id>) {
  return runAction(Id, input, async (ctx, data) => {
    const res = await invitations.duplicateInvitation(ctx, data);
    refresh();
    return res;
  });
}

export async function archiveInvitationAction(input: z.input<typeof Id>) {
  return runAction(Id, input, async (ctx, data) => {
    const res = await invitations.archiveInvitation(ctx, data);
    refresh();
    return res;
  });
}

export async function restoreInvitationAction(input: z.input<typeof Id>) {
  return runAction(Id, input, async (ctx, data) => {
    const res = await invitations.restoreInvitation(ctx, data);
    refresh();
    return res;
  });
}

export async function deleteInvitationAction(input: z.input<typeof DeleteInput>) {
  return runAction(DeleteInput, input, async (ctx, data) => {
    const res = await invitations.deleteInvitation(ctx, data);
    refresh();
    return res;
  });
}
