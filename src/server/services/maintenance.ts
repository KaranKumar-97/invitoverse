import "server-only";
import { prisma } from "@/server/db/prisma";
import { storageFor } from "@/server/integrations/storage";

const HOUR = 3600_000;
const DAY = 24 * HOUR;
const BATCH = 200;

/** Media ids referenced by an invitation's *published* snapshot (live pages must keep working). */
function publishedAssetIds(content: unknown, design: unknown): Set<string> {
  const ids = new Set<string>();
  const walk = (v: unknown) => {
    if (!v || typeof v !== "object") return;
    if (Array.isArray(v)) return v.forEach(walk);
    for (const [k, val] of Object.entries(v)) {
      if (k === "assetId" && typeof val === "string") ids.add(val);
      else walk(val);
    }
  };
  walk(content);
  walk(design);
  return ids;
}

export type CleanupResult = { removed: number; kept: number; skipped: number; failed: number };

/**
 * Daily media cleanup (docs/14 §5): deletes stored files + rows for assets soft-deleted over 24 h ago,
 * and orphans (no invitation) older than 7 days. Assets still used by a published snapshot are
 * kept until the owner republishes. Idempotent; processes at most BATCH assets per run.
 */
export async function runMediaCleanup(now = new Date()): Promise<CleanupResult> {
  const candidates = await prisma.mediaAsset.findMany({
    where: {
      OR: [
        { deletedAt: { lt: new Date(now.getTime() - DAY) } },
        { invitationId: null, createdAt: { lt: new Date(now.getTime() - 7 * DAY) } },
      ],
    },
    select: { id: true, invitationId: true, provider: true, publicId: true, kind: true },
    orderBy: { createdAt: "asc" },
    take: BATCH,
  });

  const invitationIds = [
    ...new Set(candidates.map((c) => c.invitationId).filter(Boolean)),
  ] as string[];
  const live = new Set<string>();
  if (invitationIds.length) {
    const published = await prisma.invitation.findMany({
      where: { id: { in: invitationIds }, status: "PUBLISHED" },
      select: { publishedContent: true, publishedDesign: true },
    });
    for (const inv of published)
      for (const id of publishedAssetIds(inv.publishedContent, inv.publishedDesign)) live.add(id);
  }

  const result: CleanupResult = { removed: 0, kept: 0, skipped: 0, failed: 0 };
  for (const asset of candidates) {
    if (live.has(asset.id)) {
      result.kept++;
      continue;
    }
    const storage = storageFor(asset.provider);
    if (!storage) {
      result.skipped++;
      continue;
    }
    try {
      await storage.remove(asset.publicId, asset.kind);
      await prisma.mediaAsset.delete({ where: { id: asset.id } });
      result.removed++;
    } catch (e) {
      console.error("[cron] media removal failed", asset.id, e);
      result.failed++;
    }
  }
  return result;
}

export type PurgeResult = {
  users: number;
  sessions: number;
  verificationTokens: number;
  revokedTokens: number;
};

/**
 * Daily purge (docs/14 §5, docs/13 §9): hard-deletes accounts soft-deleted over 30 days ago
 * (with their stored media; rows cascade to invitations, guests and media), plus expired
 * sessions, magic-link tokens and revoked guest tokens older than 90 days.
 */
export async function purgeDeleted(now = new Date()): Promise<PurgeResult> {
  const cutoff = new Date(now.getTime() - 30 * DAY);
  const users = await prisma.user.findMany({
    where: { deletedAt: { lt: cutoff } },
    select: { id: true },
    take: BATCH,
  });
  // Media rows cascade with the user, so remove the stored files first; a user whose files
  // can't all be removed is retried on the next run.
  const ids: string[] = [];
  for (const user of users) {
    const assets = await prisma.mediaAsset.findMany({
      where: { ownerId: user.id },
      select: { provider: true, publicId: true, kind: true },
    });
    let ok = true;
    for (const a of assets) {
      const storage = storageFor(a.provider);
      if (!storage) continue; // e.g. dev-only LOCAL files in production: nothing to remove here
      try {
        await storage.remove(a.publicId, a.kind);
      } catch (e) {
        console.error("[cron] purge: media removal failed", user.id, e);
        ok = false;
      }
    }
    if (ok) ids.push(user.id);
  }
  const [deletedUsers, sessions, verificationTokens, revokedTokens] = await prisma.$transaction([
    prisma.user.deleteMany({ where: { id: { in: ids } } }),
    prisma.session.deleteMany({ where: { expires: { lt: now } } }),
    prisma.verificationToken.deleteMany({ where: { expires: { lt: now } } }),
    prisma.revokedGuestToken.deleteMany({
      where: { revokedAt: { lt: new Date(now.getTime() - 90 * DAY) } },
    }),
  ]);
  return {
    users: deletedUsers.count,
    sessions: sessions.count,
    verificationTokens: verificationTokens.count,
    revokedTokens: revokedTokens.count,
  };
}

/** Liveness + DB ping for uptime monitors. */
export async function checkDatabase(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
