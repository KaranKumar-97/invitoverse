import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/lib/action-result";

/**
 * Loads an invitation only if it belongs to `userId`.
 * A miss is always NOT_FOUND (never FORBIDDEN) so ids can't be probed. docs/13-security.md §2
 */
export async function getOwnedInvitation<S extends Prisma.InvitationSelect>(
  userId: string,
  invitationId: string,
  select: S,
): Promise<Prisma.InvitationGetPayload<{ select: S }>> {
  const invitation = await prisma.invitation.findFirst({
    where: { id: invitationId, ownerId: userId },
    select,
  });
  if (!invitation) throw new AppError("NOT_FOUND");
  return invitation;
}

/** Prisma `where` fragment for any model owned through its invitation (guests, media). */
export function ownedViaInvitation(userId: string) {
  return { invitation: { ownerId: userId } } as const;
}
