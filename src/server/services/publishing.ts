import "server-only";
import type { Prisma } from "@prisma/client";
import { AppError } from "@/lib/action-result";
import { buildChecklist, canPublish, type ChecklistItem } from "@/lib/invitation/checklist";
import { toPublishable } from "@/lib/invitation/publishable";
import { DesignConfigSchema, DraftContentSchema } from "@/lib/invitation/schema";
import { prisma } from "@/server/db/prisma";
import { invalidatePublic } from "@/server/cache-tags";
import { logEvent } from "@/server/log";
import { isTemplateSlug } from "@/templates/registry";
import type { Ctx } from "./context";
import { canUseTemplate } from "./entitlements";

async function loadOwned(ctx: Ctx, id: string) {
  const inv = await prisma.invitation.findFirst({
    where: { id, ownerId: ctx.userId },
    select: {
      id: true,
      slug: true,
      status: true,
      disabledAt: true,
      templateSlug: true,
      draftContent: true,
      draftDesign: true,
      draftUpdatedAt: true,
      publishedAt: true,
      publishedVersion: true,
    },
  });
  if (!inv) throw new AppError("NOT_FOUND");
  return inv;
}

async function checklistFor(ctx: Ctx, inv: Awaited<ReturnType<typeof loadOwned>>) {
  const content = DraftContentSchema.parse(inv.draftContent);
  const design = DesignConfigSchema.parse(inv.draftDesign);
  const templateAvailable =
    isTemplateSlug(inv.templateSlug) && (await canUseTemplate(ctx.userId, inv.templateSlug));
  return {
    content,
    design,
    items: buildChecklist({ content, design, slug: inv.slug, templateAvailable }),
  };
}

export type PublishState = {
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  slug: string;
  publishedVersion: number;
  publishedAt: string | null;
  hasUnpublishedChanges: boolean;
  checklist: ChecklistItem[];
  canPublish: boolean;
};

export async function getPublishState(ctx: Ctx, id: string): Promise<PublishState> {
  const inv = await loadOwned(ctx, id);
  const { items } = await checklistFor(ctx, inv);
  return {
    status: inv.status,
    slug: inv.slug,
    publishedVersion: inv.publishedVersion,
    publishedAt: inv.publishedAt?.toISOString() ?? null,
    hasUnpublishedChanges:
      inv.status === "PUBLISHED" && !!inv.publishedAt && inv.draftUpdatedAt > inv.publishedAt,
    checklist: items,
    canPublish: canPublish(items),
  };
}

/**
 * Copies the current draft into the published snapshot (docs/06-publishing-workflow.md §4).
 * The draft is never modified, so the editor's optimistic lock is unaffected.
 */
export async function publishInvitation(ctx: Ctx, input: { id: string }) {
  const inv = await loadOwned(ctx, input.id);
  if (inv.status === "ARCHIVED")
    throw new AppError("VALIDATION", "Restore this invitation before publishing it.");
  if (inv.disabledAt)
    throw new AppError("FORBIDDEN", "This invitation has been disabled. Please contact support.");
  const { content, design, items } = await checklistFor(ctx, inv);
  if (!canPublish(items)) {
    const failing = items.filter((i) => i.severity === "required" && !i.ok);
    throw new AppError(
      "VALIDATION",
      `Before publishing: ${failing.map((i) => i.label.toLowerCase()).join(", ")}.`,
      { checklist: failing.map((i) => i.key) },
    );
  }
  const strict = toPublishable(content);
  if (!strict.ok) throw new AppError("VALIDATION", "Some details are invalid.");
  const eventIds = strict.content.events.map((e) => e.id);
  const now = new Date();

  const updated = await prisma.$transaction(async (tx) => {
    const res = await tx.invitation.update({
      where: { id: inv.id },
      data: {
        status: "PUBLISHED",
        publishedTemplateSlug: inv.templateSlug,
        publishedContent: strict.content as Prisma.InputJsonValue,
        publishedDesign: design as Prisma.InputJsonValue,
        publishedVersion: { increment: 1 },
        publishedAt: now > inv.draftUpdatedAt ? now : new Date(inv.draftUpdatedAt.getTime() + 1),
        unpublishedAt: null,
      },
      select: { slug: true, publishedVersion: true, publishedAt: true },
    });
    // Guests can't stay invited to events that no longer exist (docs/03-database.md §5).
    await tx.$executeRaw`
      UPDATE "Guest" SET "eventIds" = ARRAY(SELECT x FROM unnest("eventIds") AS x WHERE x = ANY(${eventIds}::text[]))
      WHERE "invitationId" = ${inv.id} AND NOT ("eventIds" <@ ${eventIds}::text[])`;
    return res;
  });

  invalidatePublic(updated.slug);
  logEvent("invitation.published", {
    userId: ctx.userId,
    invitationId: inv.id,
    version: updated.publishedVersion,
  });
  return {
    slug: updated.slug,
    publishedVersion: updated.publishedVersion,
    publishedAt: updated.publishedAt!.toISOString(),
  };
}

export async function unpublishInvitation(ctx: Ctx, input: { id: string }) {
  const inv = await loadOwned(ctx, input.id);
  if (inv.status !== "PUBLISHED") return { ok: true };
  await prisma.invitation.update({
    where: { id: inv.id },
    data: { status: "DRAFT", unpublishedAt: new Date() },
  });
  invalidatePublic(inv.slug);
  logEvent("invitation.unpublished", { userId: ctx.userId, invitationId: inv.id });
  return { ok: true };
}
