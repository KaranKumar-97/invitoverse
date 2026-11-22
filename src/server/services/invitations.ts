import "server-only";
import { Prisma, type InvitationStatus } from "@prisma/client";
import { AppError } from "@/lib/action-result";
import { alignEventsToWedding } from "@/lib/invitation/dates";
import { defaultDesign } from "@/lib/invitation/defaults";
import {
  DesignConfigSchema,
  DraftContentSchema,
  InvitationContentSchema,
  type DraftContent,
  type DesignConfig,
} from "@/lib/invitation/schema";
import { slugCandidates, slugify, slugProblem, SLUG_PROBLEM_MESSAGES } from "@/lib/slug";
import { prisma } from "@/server/db/prisma";
import { logEvent } from "@/server/log";
import { getManifest, isTemplateSlug, templateDemos } from "@/templates/registry";
import type { Ctx } from "./context";
import { canUseTemplate } from "./entitlements";
import { assertOwnMediaRefs } from "./media";
import { invalidatePublic } from "@/server/cache-tags";

export const MAX_ACTIVE_INVITATIONS = 20;
const MAX_CONTENT_BYTES = 200_000;
const MAX_DESIGN_BYTES = 20_000;

// ───────────── helpers ─────────────

const owned = (ctx: Ctx, id: string) => ({ id, ownerId: ctx.userId });

async function requireOwned<S extends Prisma.InvitationSelect>(ctx: Ctx, id: string, select: S) {
  const inv = await prisma.invitation.findFirst({ where: owned(ctx, id), select });
  if (!inv) throw new AppError("NOT_FOUND");
  return inv;
}

function isUniqueViolation(e: unknown) {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

function validationError(
  error: { issues: Array<{ path: PropertyKey[]; message: string }> },
  message = "Some values are invalid.",
) {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "_";
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return new AppError("VALIDATION", message, fieldErrors);
}

/** Values denormalised from the draft for the dashboard list (no JSON loading there). */
function denormalise(content: DraftContent) {
  return {
    weddingDate: content.weddingDate ? new Date(`${content.weddingDate}T00:00:00.000Z`) : null,
    coverImageUrl: content.media.couplePhotos[0]?.url ?? content.media.gallery[0]?.url ?? null,
  };
}

function sizeOf(value: unknown) {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}

async function slugAvailable(slug: string, excludeId?: string) {
  const hit = await prisma.invitation.findUnique({ where: { slug }, select: { id: true } });
  return !hit || hit.id === excludeId;
}

/** First free variant of a slug: base, base-2, base-3… */
async function firstFreeSlug(base: string, excludeId?: string): Promise<string> {
  const root = slugify(base).slice(0, 40) || "our-wedding";
  for (let i = 1; i < 50; i++) {
    const candidate = i === 1 ? root : `${root}-${i}`;
    if (!slugProblem(candidate) && (await slugAvailable(candidate, excludeId))) return candidate;
  }
  return `${root}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Converts strict/demo content into the draft shape stored in the database. */
export function toDraft(content: unknown): DraftContent {
  return DraftContentSchema.parse(InvitationContentSchema.parse(content));
}

// ───────────── queries ─────────────

export type InvitationListItem = {
  id: string;
  slug: string;
  title: string;
  templateSlug: string;
  templateName: string;
  status: InvitationStatus;
  hasUnpublishedChanges: boolean;
  weddingDate: string | null;
  coverImageUrl: string | null;
  guestCount: number;
  openCount: number;
  updatedAt: string;
  publishedAt: string | null;
};

export async function listInvitations(
  ctx: Ctx,
  opts: { status?: InvitationStatus | "ACTIVE"; q?: string; take?: number } = {},
): Promise<InvitationListItem[]> {
  const where: Prisma.InvitationWhereInput = { ownerId: ctx.userId };
  if (opts.status === "ACTIVE") where.status = { not: "ARCHIVED" };
  else if (opts.status) where.status = opts.status;
  if (opts.q?.trim()) {
    const q = opts.q.trim().slice(0, 80);
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { slug: { contains: q.toLowerCase() } },
    ];
  }
  const rows = await prisma.invitation.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: opts.take ?? 100,
    select: {
      id: true,
      slug: true,
      title: true,
      templateSlug: true,
      status: true,
      weddingDate: true,
      coverImageUrl: true,
      openCount: true,
      updatedAt: true,
      publishedAt: true,
      draftUpdatedAt: true,
      template: { select: { name: true } },
      _count: { select: { guests: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    templateSlug: r.templateSlug,
    templateName: r.template.name,
    status: r.status,
    hasUnpublishedChanges:
      r.status === "PUBLISHED" && !!r.publishedAt && r.draftUpdatedAt > r.publishedAt,
    weddingDate: r.weddingDate ? r.weddingDate.toISOString().slice(0, 10) : null,
    coverImageUrl: r.coverImageUrl,
    guestCount: r._count.guests,
    openCount: r.openCount,
    updatedAt: r.updatedAt.toISOString(),
    publishedAt: r.publishedAt?.toISOString() ?? null,
  }));
}

export async function getOverviewStats(ctx: Ctx) {
  const [byStatus, guests, opens] = await Promise.all([
    prisma.invitation.groupBy({
      by: ["status"],
      where: { ownerId: ctx.userId },
      _count: { _all: true },
    }),
    prisma.guest.count({
      where: { invitation: { ownerId: ctx.userId, status: { not: "ARCHIVED" } } },
    }),
    prisma.invitation.aggregate({
      where: { ownerId: ctx.userId, status: { not: "ARCHIVED" } },
      _sum: { openCount: true },
    }),
  ]);
  const count = (s: InvitationStatus) => byStatus.find((b) => b.status === s)?._count._all ?? 0;
  return {
    invitations: count("DRAFT") + count("PUBLISHED"),
    drafts: count("DRAFT"),
    published: count("PUBLISHED"),
    archived: count("ARCHIVED"),
    guests,
    opens: opens._sum.openCount ?? 0,
  };
}

export type EditorInvitation = {
  id: string;
  slug: string;
  title: string;
  status: InvitationStatus;
  templateSlug: string;
  content: DraftContent;
  design: DesignConfig;
  draftUpdatedAt: string;
  hasUnpublishedChanges: boolean;
};

export async function getInvitationForEditor(ctx: Ctx, id: string): Promise<EditorInvitation> {
  const inv = await requireOwned(ctx, id, {
    id: true,
    slug: true,
    title: true,
    status: true,
    templateSlug: true,
    draftContent: true,
    draftDesign: true,
    draftUpdatedAt: true,
    publishedAt: true,
  });
  const manifest = getManifest(inv.templateSlug);
  const designParsed = DesignConfigSchema.safeParse(inv.draftDesign);
  return {
    id: inv.id,
    slug: inv.slug,
    title: inv.title,
    status: inv.status,
    templateSlug: inv.templateSlug,
    content: DraftContentSchema.parse(inv.draftContent),
    design: designParsed.success
      ? designParsed.data
      : manifest
        ? defaultDesign(manifest)
        : (inv.draftDesign as DesignConfig),
    draftUpdatedAt: inv.draftUpdatedAt.toISOString(),
    hasUnpublishedChanges:
      inv.status === "PUBLISHED" && !!inv.publishedAt && inv.draftUpdatedAt > inv.publishedAt,
  };
}

// ───────────── mutations ─────────────

async function assertUnderLimit(ctx: Ctx) {
  const active = await prisma.invitation.count({
    where: { ownerId: ctx.userId, status: { not: "ARCHIVED" } },
  });
  if (active >= MAX_ACTIVE_INVITATIONS) {
    throw new AppError(
      "LIMIT_EXCEEDED",
      `You can have up to ${MAX_ACTIVE_INVITATIONS} active invitations. Archive one to create another.`,
    );
  }
}

export async function createInvitation(
  ctx: Ctx,
  input: {
    templateSlug: string;
    brideName: string;
    groomName: string;
    order: "BRIDE_FIRST" | "GROOM_FIRST";
    weddingDate: string;
    slug?: string;
  },
) {
  if (
    !isTemplateSlug(input.templateSlug) ||
    !(await canUseTemplate(ctx.userId, input.templateSlug))
  ) {
    throw new AppError("NOT_FOUND", "That design isn't available.");
  }
  await assertUnderLimit(ctx);
  const manifest = getManifest(input.templateSlug)!;
  const demo = templateDemos[input.templateSlug];

  // Start from the template's sample content so the preview looks finished; mark it as sample.
  const sample = toDraft(demo.content);
  const content: DraftContent = {
    ...sample,
    // Sample events follow the couple's date, so the countdown and dates aren't the demo's year.
    events: alignEventsToWedding(sample.events, demo.content.weddingDate, input.weddingDate),
    couple: {
      order: input.order,
      bride: { firstName: input.brideName.trim(), lastName: "", shortBio: "" },
      groom: { firstName: input.groomName.trim(), lastName: "", shortBio: "" },
      monogram: "",
    },
    weddingDate: input.weddingDate,
    hashtag: "",
    sample: ["families", "wedding", "messages", "events", "media"],
  };
  // Demo design overrides are trusted template code (plain object), merged over the defaults.
  const design: DesignConfig = {
    ...defaultDesign(manifest),
    ...(demo.design as Partial<DesignConfig>),
  };
  const [first, second] =
    input.order === "GROOM_FIRST"
      ? [input.groomName, input.brideName]
      : [input.brideName, input.groomName];
  const title = `${first.trim()} & ${second.trim()} Wedding`.slice(0, 120);

  let slug: string;
  if (input.slug) {
    const problem = slugProblem(input.slug);
    if (problem)
      throw new AppError("VALIDATION", SLUG_PROBLEM_MESSAGES[problem], {
        slug: [SLUG_PROBLEM_MESSAGES[problem]],
      });
    slug = input.slug;
  } else {
    slug = await firstFreeSlug(slugCandidates(first, second)[0] ?? "our-wedding");
  }

  try {
    const created = await prisma.invitation.create({
      data: {
        ownerId: ctx.userId,
        templateSlug: input.templateSlug,
        slug,
        title,
        draftContent: content as Prisma.InputJsonValue,
        draftDesign: design as Prisma.InputJsonValue,
        ...denormalise(content),
      },
      select: { id: true, slug: true },
    });
    return created;
  } catch (e) {
    if (isUniqueViolation(e))
      throw new AppError("CONFLICT", "That link was just taken. Please choose another.", {
        slug: ["Already taken"],
      });
    throw e;
  }
}

export async function saveDraft(
  ctx: Ctx,
  input: { id: string; draftUpdatedAt: string; content?: unknown; design?: unknown },
): Promise<{ draftUpdatedAt: string }> {
  const data: Prisma.InvitationUpdateManyMutationInput = {};
  if (input.content !== undefined) {
    const parsed = DraftContentSchema.safeParse(input.content);
    if (!parsed.success) throw validationError(parsed.error);
    if (sizeOf(parsed.data) > MAX_CONTENT_BYTES)
      throw new AppError("LIMIT_EXCEEDED", "This invitation has too much text.");
    data.draftContent = parsed.data as Prisma.InputJsonValue;
    Object.assign(data, denormalise(parsed.data));
  }
  if (input.design !== undefined) {
    const parsed = DesignConfigSchema.safeParse(input.design);
    if (!parsed.success) throw validationError(parsed.error);
    if (sizeOf(parsed.data) > MAX_DESIGN_BYTES) throw new AppError("LIMIT_EXCEEDED");
    data.draftDesign = parsed.data as Prisma.InputJsonValue;
  }
  if (data.draftContent !== undefined || data.draftDesign !== undefined) {
    await assertOwnMediaRefs(
      ctx,
      input.id,
      data.draftContent as DraftContent | undefined,
      data.draftDesign as DesignConfig | undefined,
    );
  }
  const now = new Date();
  data.draftUpdatedAt = now;

  const expected = new Date(input.draftUpdatedAt);
  if (Number.isNaN(expected.getTime())) throw new AppError("VALIDATION");

  // Ownership + optimistic concurrency in a single statement.
  const res = await prisma.invitation.updateMany({
    where: { ...owned(ctx, input.id), draftUpdatedAt: expected },
    data,
  });
  if (res.count === 0) {
    const exists = await prisma.invitation.count({ where: owned(ctx, input.id) });
    throw new AppError(exists ? "CONFLICT" : "NOT_FOUND");
  }
  return { draftUpdatedAt: now.toISOString() };
}

export async function updateTitle(ctx: Ctx, input: { id: string; title: string }) {
  const title = input.title.trim();
  if (!title || title.length > 120)
    throw new AppError("VALIDATION", "Title must be 1–120 characters.", {
      title: ["1–120 characters"],
    });
  const res = await prisma.invitation.updateMany({ where: owned(ctx, input.id), data: { title } });
  if (!res.count) throw new AppError("NOT_FOUND");
  return { title };
}

export async function checkSlug(
  ctx: Ctx,
  input: { slug: string; excludeId?: string; names?: [string, string]; weddingDate?: string },
) {
  const slug = input.slug.trim().toLowerCase();
  const problem = slugProblem(slug);
  const available = !problem && (await slugAvailable(slug, input.excludeId));
  const suggestions: string[] = [];
  if (!available) {
    const pool = [
      ...(input.names ? slugCandidates(input.names[0], input.names[1], input.weddingDate) : []),
      ...(problem
        ? []
        : [
            `${slug}-${input.weddingDate?.slice(0, 4) ?? "wedding"}`,
            `${slug}-celebrations`,
            `${slug}-2`,
          ]),
    ];
    for (const c of [...new Set(pool)]) {
      if (c !== slug && !slugProblem(c) && (await slugAvailable(c, input.excludeId)))
        suggestions.push(c);
      if (suggestions.length >= 3) break;
    }
  }
  void ctx;
  return {
    slug,
    available,
    reason: problem
      ? SLUG_PROBLEM_MESSAGES[problem]
      : available
        ? null
        : "This link is already taken.",
    suggestions,
  };
}

export async function changeSlug(ctx: Ctx, input: { id: string; slug: string }) {
  const slug = input.slug.trim().toLowerCase();
  const problem = slugProblem(slug);
  if (problem)
    throw new AppError("VALIDATION", SLUG_PROBLEM_MESSAGES[problem], {
      slug: [SLUG_PROBLEM_MESSAGES[problem]],
    });
  const before = await requireOwned(ctx, input.id, { id: true, slug: true });
  try {
    await prisma.invitation.update({ where: { id: input.id }, data: { slug } });
    invalidatePublic(before.slug, slug);
  } catch (e) {
    if (isUniqueViolation(e))
      throw new AppError("CONFLICT", "That link is already taken.", { slug: ["Already taken"] });
    throw e;
  }
  return { slug };
}

export async function switchTemplate(ctx: Ctx, input: { id: string; templateSlug: string }) {
  if (
    !isTemplateSlug(input.templateSlug) ||
    !(await canUseTemplate(ctx.userId, input.templateSlug))
  ) {
    throw new AppError("NOT_FOUND", "That design isn't available.");
  }
  await requireOwned(ctx, input.id, { id: true });
  const design = defaultDesign(getManifest(input.templateSlug)!);
  const now = new Date();
  await prisma.invitation.update({
    where: { id: input.id },
    data: {
      templateSlug: input.templateSlug,
      draftDesign: design as Prisma.InputJsonValue,
      draftUpdatedAt: now,
    },
  });
  return { templateSlug: input.templateSlug, design, draftUpdatedAt: now.toISOString() };
}

export async function duplicateInvitation(ctx: Ctx, input: { id: string }) {
  await assertUnderLimit(ctx);
  return prisma.$transaction(async (tx) => {
    const src = await tx.invitation.findFirst({
      where: owned(ctx, input.id),
      select: {
        slug: true,
        title: true,
        templateSlug: true,
        draftContent: true,
        draftDesign: true,
        weddingDate: true,
        coverImageUrl: true,
      },
    });
    if (!src) throw new AppError("NOT_FOUND");
    const slug = await firstFreeSlug(`${src.slug.replace(/-copy(-\d+)?$/, "").slice(0, 34)}-copy`);
    return tx.invitation.create({
      data: {
        ownerId: ctx.userId,
        templateSlug: src.templateSlug,
        slug,
        title: `${src.title} (copy)`.slice(0, 120),
        draftContent: src.draftContent as Prisma.InputJsonValue,
        draftDesign: src.draftDesign as Prisma.InputJsonValue,
        weddingDate: src.weddingDate,
        coverImageUrl: src.coverImageUrl,
      },
      select: { id: true, slug: true },
    });
  });
}

export async function archiveInvitation(ctx: Ctx, input: { id: string }) {
  const target = await prisma.invitation.findFirst({
    where: owned(ctx, input.id),
    select: { slug: true },
  });
  const res = await prisma.invitation.updateMany({
    where: { ...owned(ctx, input.id), status: { not: "ARCHIVED" } },
    data: { status: "ARCHIVED", archivedAt: new Date() },
  });
  if (!res.count) {
    await requireOwned(ctx, input.id, { id: true }); // NOT_FOUND if not theirs; no-op if already archived
  }
  invalidatePublic(target?.slug);
  return { ok: true };
}

export async function restoreInvitation(ctx: Ctx, input: { id: string }) {
  await assertUnderLimit(ctx);
  const res = await prisma.invitation.updateMany({
    where: { ...owned(ctx, input.id), status: "ARCHIVED" },
    data: { status: "DRAFT", archivedAt: null },
  });
  if (!res.count) await requireOwned(ctx, input.id, { id: true });
  return { ok: true };
}

export async function deleteInvitation(ctx: Ctx, input: { id: string; confirmSlug: string }) {
  const inv = await requireOwned(ctx, input.id, { id: true, slug: true, status: true });
  if (inv.status !== "ARCHIVED")
    throw new AppError("VALIDATION", "Archive the invitation before deleting it permanently.");
  if (input.confirmSlug.trim() !== inv.slug) {
    throw new AppError("VALIDATION", "Type the invitation link exactly to confirm.", {
      confirmSlug: ["Doesn't match"],
    });
  }
  await prisma.$transaction([
    prisma.mediaAsset.updateMany({
      where: { invitationId: inv.id },
      data: { deletedAt: new Date() },
    }),
    prisma.invitation.delete({ where: { id: inv.id } }),
  ]);
  invalidatePublic(inv.slug);
  logEvent("invitation.deleted", { userId: ctx.userId, invitationId: inv.id });
  return { ok: true };
}
