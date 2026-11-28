import "server-only";
import { unstable_cache } from "next/cache";
import {
  DesignConfigSchema,
  InvitationContentSchema,
  type DesignConfig,
  type InvitationContent,
} from "@/lib/invitation/schema";
import { prisma } from "@/server/db/prisma";
import { slugTag } from "@/server/cache-tags";

export type PublishedInvitation = {
  id: string;
  slug: string;
  templateSlug: string;
  content: InvitationContent;
  design: DesignConfig;
  publishedVersion: number;
  publishedAt: string;
};

/**
 * The only way public routes read invitations: PUBLISHED, not disabled, published snapshot only.
 * Never returns owner data or the draft.
 */
export async function loadPublishedBySlug(slug: string): Promise<PublishedInvitation | null> {
  if (!/^[a-z0-9-]{3,48}$/.test(slug)) return null;
  const row = await prisma.invitation.findFirst({
    where: { slug, status: "PUBLISHED", disabledAt: null },
    select: {
      id: true,
      slug: true,
      publishedTemplateSlug: true,
      publishedContent: true,
      publishedDesign: true,
      publishedVersion: true,
      publishedAt: true,
    },
  });
  if (
    !row?.publishedContent ||
    !row.publishedDesign ||
    !row.publishedTemplateSlug ||
    !row.publishedAt
  )
    return null;
  const content = InvitationContentSchema.safeParse(row.publishedContent);
  const design = DesignConfigSchema.safeParse(row.publishedDesign);
  if (!content.success || !design.success) {
    console.error(`[public] invalid published snapshot for ${slug}`);
    return null;
  }
  return {
    id: row.id,
    slug: row.slug,
    templateSlug: row.publishedTemplateSlug,
    content: content.data,
    design: design.data,
    publishedVersion: row.publishedVersion,
    publishedAt: row.publishedAt.toISOString(),
  };
}

/** Cached per slug; purged on publish / unpublish / archive / slug change (cache-tags.ts). */
export async function getPublishedInvitationBySlug(slug: string) {
  try {
    return await unstable_cache(() => loadPublishedBySlug(slug), ["published-invitation", slug], {
      tags: [slugTag(slug)],
    })();
  } catch (e) {
    // Outside a Next.js server (scripts, integration tests) there is no cache to use.
    if (e instanceof Error && e.message.includes("incrementalCache missing"))
      return loadPublishedBySlug(slug);
    throw e;
  }
}

/** Adds one open to today's row for an invitation (docs/19 §4.4 analytics). */
async function countDailyOpen(invitationId: string, guest: boolean) {
  await prisma.$executeRaw`
    INSERT INTO "InvitationDailyStat" ("invitationId", "date", "opens", "guestOpens")
    VALUES (${invitationId}, CURRENT_DATE, 1, ${guest ? 1 : 0})
    ON CONFLICT ("invitationId", "date") DO UPDATE
    SET "opens" = "InvitationDailyStat"."opens" + 1,
        "guestOpens" = "InvitationDailyStat"."guestOpens" + ${guest ? 1 : 0}`;
}

/** Counts an open (public link). Never throws, never reveals whether the slug exists. */
export async function recordPublicOpen(slug: string) {
  if (!/^[a-z0-9-]{3,48}$/.test(slug)) return;
  try {
    const rows = await prisma.$queryRaw<Array<{ id: string }>>`
      UPDATE "Invitation" SET "openCount" = "openCount" + 1
      WHERE "slug" = ${slug} AND "status" = 'PUBLISHED'::"InvitationStatus" AND "disabledAt" IS NULL
      RETURNING "id"`;
    if (rows[0]) await countDailyOpen(rows[0].id, false);
  } catch {
    /* never fail a beacon */
  }
}

// ───────────── Guests (docs/07-guest-links-and-privacy.md) ─────────────

const TOKEN_RE = /^[A-Za-z0-9_-]{22}$/;

export type GuestViewInput = {
  displayName: string;
  greeting: string | null;
  personalNote: string | null;
  eventAccess: "ALL" | "SELECTED";
  eventIds: string[];
};

/**
 * Resolves a personal link. The token must belong to *this* invitation; revoked and unknown
 * tokens are indistinguishable. Only display fields + event access leave this function.
 */
export async function getGuestView(
  slug: string,
  token: string,
): Promise<{ invitation: PublishedInvitation; guest: GuestViewInput } | null> {
  if (!TOKEN_RE.test(token)) return null;
  const invitation = await getPublishedInvitationBySlug(slug);
  if (!invitation) return null;
  const guest = await prisma.guest.findFirst({
    where: { token, invitationId: invitation.id },
    select: {
      displayName: true,
      greeting: true,
      personalNote: true,
      eventAccess: true,
      eventIds: true,
    },
  });
  return guest ? { invitation, guest } : null;
}

/** Guest open: status → OPENED, counters + timestamps. Silent no-op for anything invalid. */
export async function recordGuestOpen(slug: string, token: string) {
  if (!TOKEN_RE.test(token) || !/^[a-z0-9-]{3,48}$/.test(slug)) return;
  try {
    const rows = await prisma.$queryRaw<Array<{ invitationId: string }>>`
      UPDATE "Guest" AS g
      SET "openCount" = g."openCount" + 1,
          "lastOpenedAt" = now(),
          "firstOpenedAt" = COALESCE(g."firstOpenedAt", now()),
          "status" = 'OPENED'::"GuestStatus",
          "updatedAt" = now()
      FROM "Invitation" AS i
      WHERE g."invitationId" = i."id" AND g."token" = ${token} AND i."slug" = ${slug}
        AND i."status" = 'PUBLISHED'::"InvitationStatus" AND i."disabledAt" IS NULL
      RETURNING g."invitationId"`;
    if (rows[0]) {
      await prisma.invitation.update({
        where: { id: rows[0].invitationId },
        data: { openCount: { increment: 1 } },
      });
      await countDailyOpen(rows[0].invitationId, true);
    }
  } catch {
    /* never fail a beacon */
  }
}
