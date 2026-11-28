"use server";

import { z } from "zod";
import { runAction } from "@/server/actions/define";
import {
  actingForGuest,
  actingForInvitation,
  auditAdminEdit,
} from "@/server/services/admin-acting";
import * as guests from "@/server/services/guests";

const Id = z.string().min(1).max(40);
const Fields = z.object({
  displayName: z.string().max(200),
  greeting: z.string().max(400).nullable().optional(),
  personalNote: z.string().max(1000).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  phone: z.string().max(40).nullable().optional(),
  eventAccess: z.enum(["ALL", "SELECTED"]),
  eventIds: z.array(z.string().max(20)).max(15),
});
const AddInput = Fields.extend({ invitationId: Id });
const UpdateInput = Fields.extend({ id: Id });
const BulkInput = z.object({
  invitationId: Id,
  lines: z.string().max(60_000),
  eventAccess: z.enum(["ALL", "SELECTED"]),
  eventIds: z.array(z.string().max(20)).max(15),
});
const GuestId = z.object({ id: Id });

// Field-level rules (lengths, phone format, event ids) are enforced by the service.
// Owners act as themselves; admins with invitations.guests act as the owner, audited (docs/19).

const forInvitation = async (ctx: { userId: string }, invitationId: string, action: string) => {
  const a = await actingForInvitation(ctx, invitationId, "invitations.guests");
  if (a.asAdmin) await auditAdminEdit(ctx.userId, invitationId, action);
  return a.ctx;
};
const forGuest = async (ctx: { userId: string }, guestId: string, action: string) => {
  const a = await actingForGuest(ctx, guestId);
  if (a.asAdmin && a.invitationId) await auditAdminEdit(ctx.userId, a.invitationId, action);
  return a.ctx;
};

export async function addGuestAction(input: z.input<typeof AddInput>) {
  return runAction(AddInput, input, async (ctx, data) =>
    guests.addGuest(await forInvitation(ctx, data.invitationId, "guest.added"), data),
  );
}

export async function updateGuestAction(input: z.input<typeof UpdateInput>) {
  return runAction(UpdateInput, input, async (ctx, data) =>
    guests.updateGuest(await forGuest(ctx, data.id, "guest.updated"), data),
  );
}

export async function bulkAddGuestsAction(input: z.input<typeof BulkInput>) {
  return runAction(BulkInput, input, async (ctx, data) => {
    const owner = await forInvitation(ctx, data.invitationId, "guest.bulk_added");
    const res = await guests.bulkAddGuests(owner, data);
    return { ...res, guests: await guests.listGuests(owner, data.invitationId) };
  });
}

export async function deleteGuestAction(input: z.input<typeof GuestId>) {
  return runAction(GuestId, input, async (ctx, data) =>
    guests.deleteGuest(await forGuest(ctx, data.id, "guest.deleted"), data),
  );
}

export async function regenerateGuestLinkAction(input: z.input<typeof GuestId>) {
  return runAction(GuestId, input, async (ctx, data) =>
    guests.regenerateGuestToken(await forGuest(ctx, data.id, "guest.link_regenerated"), data),
  );
}

export async function markGuestSharedAction(input: z.input<typeof GuestId>) {
  return runAction(GuestId, input, async (ctx, data) =>
    guests.markGuestShared(await forGuest(ctx, data.id, "guest.shared"), data),
  );
}
