"use server";

import { z } from "zod";
import { runAction } from "@/server/actions/define";
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

export async function addGuestAction(input: z.input<typeof AddInput>) {
  return runAction(AddInput, input, (ctx, data) => guests.addGuest(ctx, data));
}

export async function updateGuestAction(input: z.input<typeof UpdateInput>) {
  return runAction(UpdateInput, input, (ctx, data) => guests.updateGuest(ctx, data));
}

export async function bulkAddGuestsAction(input: z.input<typeof BulkInput>) {
  return runAction(BulkInput, input, async (ctx, data) => {
    const res = await guests.bulkAddGuests(ctx, data);
    return { ...res, guests: await guests.listGuests(ctx, data.invitationId) };
  });
}

export async function deleteGuestAction(input: z.input<typeof GuestId>) {
  return runAction(GuestId, input, (ctx, data) => guests.deleteGuest(ctx, data));
}

export async function regenerateGuestLinkAction(input: z.input<typeof GuestId>) {
  return runAction(GuestId, input, (ctx, data) => guests.regenerateGuestToken(ctx, data));
}

export async function markGuestSharedAction(input: z.input<typeof GuestId>) {
  return runAction(GuestId, input, (ctx, data) => guests.markGuestShared(ctx, data));
}
