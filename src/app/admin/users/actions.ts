"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { runAction } from "@/server/actions/define";
import * as svc from "@/server/services/admin-users";

// Services check permissions: users.edit (suspend) and users.view_pii (reveal).

const SuspendInput = z.object({
  userId: z.string().min(1).max(40),
  suspended: z.boolean(),
  reason: z.string().trim().max(300).optional(),
});
const RevealInput = z.object({ guestId: z.string().min(1).max(40) });

export async function setUserSuspendedAction(input: z.input<typeof SuspendInput>) {
  return runAction(SuspendInput, input, async (ctx, d) => {
    const r = await svc.setUserSuspended(ctx, d);
    revalidatePath(`/admin/users/${d.userId}`);
    revalidatePath("/admin/users");
    return r;
  });
}

export async function revealGuestContactAction(input: z.input<typeof RevealInput>) {
  return runAction(RevealInput, input, (ctx, d) => svc.revealGuestContact(ctx, d));
}

const RenameInput = z.object({ userId: z.string().min(1).max(40), name: z.string().max(80) });
const GrantInput = z.object({
  userId: z.string().min(1).max(40),
  templateSlug: z.string().min(1).max(60),
  expiresAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
});
const RevokeInput = z.object({
  userId: z.string().min(1).max(40),
  entitlementId: z.string().min(1).max(40),
});
const DeleteInput = z.object({
  userId: z.string().min(1).max(40),
  confirmEmail: z.string().max(254),
  reason: z.string().trim().min(3, "Add a reason").max(300),
});

const refreshUser = (userId: string) => {
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/users");
  revalidatePath("/admin/audit");
};

export async function renameUserAction(input: z.input<typeof RenameInput>) {
  return runAction(RenameInput, input, async (ctx, d) => {
    const r = await svc.renameUser(ctx, d);
    refreshUser(d.userId);
    return r;
  });
}

export async function grantTemplateAccessAction(input: z.input<typeof GrantInput>) {
  return runAction(GrantInput, input, async (ctx, d) => {
    const r = await svc.grantTemplateAccess(ctx, d);
    refreshUser(d.userId);
    return r;
  });
}

export async function revokeAccessAction(input: z.input<typeof RevokeInput>) {
  return runAction(RevokeInput, input, async (ctx, d) => {
    const r = await svc.revokeAccess(ctx, { entitlementId: d.entitlementId });
    refreshUser(d.userId);
    return r;
  });
}

export async function deleteUserAccountAction(input: z.input<typeof DeleteInput>) {
  return runAction(DeleteInput, input, async (ctx, d) => {
    const r = await svc.deleteUserAccount(ctx, d);
    refreshUser(d.userId);
    return r;
  });
}
