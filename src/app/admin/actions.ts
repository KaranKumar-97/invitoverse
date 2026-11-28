"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { PERMISSION_KEYS, type PermissionKey } from "@/lib/admin/permissions";
import { runAction } from "@/server/actions/define";
import * as team from "@/server/services/admin-team";

// Every service re-checks that the caller is a Superadmin (src/server/services/admin-access.ts).

const UserId = z.string().min(1).max(40);

const AddAdminInput = z.object({
  email: z.string().trim().email("Enter a valid email").max(254),
  role: z.enum(["ADMIN", "SUPERADMIN"]),
});
const SetRoleInput = z.object({ userId: UserId, role: z.enum(["USER", "ADMIN", "SUPERADMIN"]) });
const SetPermissionInput = z.object({
  userId: UserId,
  key: z.enum(PERMISSION_KEYS as [PermissionKey, ...PermissionKey[]]),
  allowed: z.boolean(),
});
const PresetInput = z.object({ userId: UserId, presetId: z.string().min(1).max(40) });

function refresh() {
  revalidatePath("/admin/admins");
  revalidatePath("/admin/audit");
}

export async function addAdminAction(input: z.input<typeof AddAdminInput>) {
  return runAction(AddAdminInput, input, async (ctx, data) => {
    const res = await team.addAdmin(ctx, data);
    refresh();
    return res;
  });
}

export async function setAdminRoleAction(input: z.input<typeof SetRoleInput>) {
  return runAction(SetRoleInput, input, async (ctx, data) => {
    const res = await team.setAdminRole(ctx, data);
    refresh();
    return res;
  });
}

export async function setAdminPermissionAction(input: z.input<typeof SetPermissionInput>) {
  return runAction(SetPermissionInput, input, async (ctx, data) => {
    const res = await team.setAdminPermission(ctx, data);
    refresh();
    return res;
  });
}

export async function applyAdminPresetAction(input: z.input<typeof PresetInput>) {
  return runAction(PresetInput, input, async (ctx, data) => {
    const res = await team.applyAdminPreset(ctx, data);
    refresh();
    return res;
  });
}
