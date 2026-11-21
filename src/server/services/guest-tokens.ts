import "server-only";
import { randomBytes } from "node:crypto";
import type { Prisma } from "@prisma/client";

export const GUEST_TOKEN_RE = /^[A-Za-z0-9_-]{22}$/;

/** 22 chars base64url = 128 bits (docs/07-guest-links-and-privacy.md §3). */
export function generateGuestToken(): string {
  return randomBytes(16).toString("base64url");
}

export async function createUniqueToken(
  db: Prisma.TransactionClient | { guest: Prisma.TransactionClient["guest"] },
): Promise<string> {
  for (let i = 0; i < 3; i++) {
    const token = generateGuestToken();
    const clash = await db.guest.findUnique({ where: { token }, select: { id: true } });
    if (!clash) return token; // collision probability ≈ 0; the loop is belt and braces
  }
  throw new Error("TOKEN_GENERATION_FAILED");
}
