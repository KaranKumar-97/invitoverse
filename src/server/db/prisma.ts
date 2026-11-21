import "server-only";
import { PrismaClient } from "@prisma/client";

/**
 * Single Prisma client per process (cached on globalThis to survive hot reloads).
 * Only src/server/** may import this — app code goes through services.
 * Production on Neon: use the pooled DATABASE_URL (docs/03-database.md §6).
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
