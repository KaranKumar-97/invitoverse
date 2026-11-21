import "server-only";
import { customAlphabet } from "nanoid";
import { Prisma, type MediaAsset } from "@prisma/client";
import { AppError } from "@/lib/action-result";
import type { DesignConfig, DraftContent } from "@/lib/invitation/schema";
import {
  INVITATION_QUOTA,
  MEDIA_RULES,
  ROLE_KIND,
  validateFile,
  type MediaAssetDTO,
  type MediaRole,
  type UploadTicket,
} from "@/lib/media";
import { prisma } from "@/server/db/prisma";
import { getMediaStorage } from "@/server/integrations/storage";
import type { Ctx } from "./context";

const keyId = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 12);

async function requireOwnedInvitation(ctx: Ctx, invitationId: string) {
  const inv = await prisma.invitation.findFirst({
    where: { id: invitationId, ownerId: ctx.userId, status: { not: "ARCHIVED" } },
    select: { id: true },
  });
  if (!inv) throw new AppError("NOT_FOUND");
  return inv;
}

const keyPrefix = (ctx: Ctx, invitationId: string) => `vivah/${ctx.userId}/${invitationId}/`;

export function toDTO(
  a: Pick<
    MediaAsset,
    | "id"
    | "kind"
    | "role"
    | "url"
    | "width"
    | "height"
    | "bytes"
    | "durationSec"
    | "mimeType"
    | "alt"
    | "publicId"
    | "provider"
  >,
): MediaAssetDTO {
  return {
    id: a.id,
    kind: a.kind,
    role: (a.role as MediaRole | null) ?? null,
    url: a.url,
    posterUrl:
      a.kind === "VIDEO" && a.provider === "CLOUDINARY"
        ? a.url.replace("/upload/", "/upload/so_1/").replace(/\.[a-z0-9]+$/i, ".jpg")
        : null,
    width: a.width,
    height: a.height,
    bytes: a.bytes,
    durationSec: a.durationSec,
    mimeType: a.mimeType,
    alt: a.alt ?? "",
  };
}

async function assertQuota(invitationId: string, kind: "IMAGE" | "VIDEO" | "AUDIO", bytes: number) {
  const live = await prisma.mediaAsset.groupBy({
    by: ["kind"],
    where: { invitationId, deletedAt: null },
    _count: { _all: true },
    _sum: { bytes: true },
  });
  const count = (k: string) => live.find((l) => l.kind === k)?._count._all ?? 0;
  const total = live.reduce((s, l) => s + (l._sum.bytes ?? 0), 0);
  const cap = {
    IMAGE: INVITATION_QUOTA.images,
    VIDEO: INVITATION_QUOTA.videos,
    AUDIO: INVITATION_QUOTA.audio,
  }[kind];
  if (count(kind) >= cap) {
    throw new AppError(
      "LIMIT_EXCEEDED",
      kind === "IMAGE"
        ? `You can upload up to ${cap} photos per invitation. Remove some to add more.`
        : `Remove the current ${kind === "VIDEO" ? "video" : "song"} before uploading another.`,
    );
  }
  if (total + bytes > INVITATION_QUOTA.totalBytes)
    throw new AppError("LIMIT_EXCEEDED", "This invitation has reached its 300 MB storage limit.");
}

/** Step 1: authorise an upload and hand the browser a signed, single-object ticket. */
export async function signUpload(
  ctx: Ctx,
  input: { invitationId: string; role: MediaRole; mimeType: string; bytes: number },
): Promise<UploadTicket> {
  await requireOwnedInvitation(ctx, input.invitationId);
  const kind = ROLE_KIND[input.role];
  const problem = validateFile(kind, input.mimeType, input.bytes);
  if (problem) throw new AppError("VALIDATION", problem);
  const storage = getMediaStorage();
  if (
    storage.provider === "LOCAL" &&
    (input.mimeType === "image/heic" ||
      input.mimeType === "image/heif" ||
      input.mimeType === "image/avif")
  ) {
    throw new AppError(
      "VALIDATION",
      "HEIC/AVIF need cloud storage. Please upload a JPG, PNG or WebP for now.",
    );
  }
  await assertQuota(input.invitationId, kind, input.bytes);
  const ext = MEDIA_RULES[kind].mimes[input.mimeType];
  const base = `${keyPrefix(ctx, input.invitationId)}${keyId()}`;
  const key = storage.provider === "LOCAL" ? `${base}.${ext}` : base;
  return storage.createUploadTicket({
    key,
    kind,
    mimeType: input.mimeType,
    maxBytes: MEDIA_RULES[kind].maxBytes,
  });
}

/** Step 2: after the browser uploaded, verify the stored object and record it. */
export async function confirmUpload(
  ctx: Ctx,
  input: { invitationId: string; role: MediaRole; key: string },
): Promise<MediaAssetDTO> {
  await requireOwnedInvitation(ctx, input.invitationId);
  if (!input.key.startsWith(keyPrefix(ctx, input.invitationId)) || input.key.includes(".."))
    throw new AppError("NOT_FOUND");
  const kind = ROLE_KIND[input.role];
  const storage = getMediaStorage();

  const existing = await prisma.mediaAsset.findUnique({
    where: { provider_publicId: { provider: storage.provider, publicId: input.key } },
  });
  if (existing) {
    if (existing.ownerId !== ctx.userId) throw new AppError("NOT_FOUND");
    return toDTO(existing);
  }

  const info = await storage.inspect(input.key, kind);
  if (!info) throw new AppError("NOT_FOUND", "We couldn't find that upload. Please try again.");
  const rule = MEDIA_RULES[kind];
  const badType = !Object.keys(rule.mimes).includes(info.mimeType);
  const tooBig = info.bytes > rule.maxBytes;
  const noSize = kind === "IMAGE" && (!info.width || !info.height);
  if (badType || tooBig || noSize) {
    await storage.remove(input.key, kind).catch(() => {});
    throw new AppError(
      "VALIDATION",
      tooBig
        ? `That file is too large. Use ${rule.label}.`
        : noSize
          ? "We couldn't read that image. Try a JPG or PNG."
          : `Unsupported file. Use ${rule.label}.`,
    );
  }

  try {
    const asset = await prisma.mediaAsset.create({
      data: {
        ownerId: ctx.userId,
        invitationId: input.invitationId,
        kind,
        role: input.role,
        provider: storage.provider,
        publicId: input.key,
        url: info.url,
        mimeType: info.mimeType,
        bytes: info.bytes,
        width: info.width,
        height: info.height,
        durationSec: info.durationSec,
      },
    });
    return toDTO(asset);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const again = await prisma.mediaAsset.findFirst({
        where: { publicId: input.key, ownerId: ctx.userId },
      });
      if (again) return toDTO(again);
    }
    throw e;
  }
}

export async function listMedia(ctx: Ctx, invitationId: string): Promise<MediaAssetDTO[]> {
  await requireOwnedInvitation(ctx, invitationId);
  const rows = await prisma.mediaAsset.findMany({
    where: { invitationId, ownerId: ctx.userId, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toDTO);
}

export async function getStorageUsage(ctx: Ctx, invitationId: string) {
  await requireOwnedInvitation(ctx, invitationId);
  const agg = await prisma.mediaAsset.aggregate({
    where: { invitationId, deletedAt: null },
    _sum: { bytes: true },
  });
  return { usedBytes: agg._sum.bytes ?? 0, limitBytes: INVITATION_QUOTA.totalBytes };
}

/** Soft delete (restorable for undo; purged by the cleanup job later). */
export async function deleteMedia(ctx: Ctx, input: { id: string }) {
  const res = await prisma.mediaAsset.updateMany({
    where: { id: input.id, ownerId: ctx.userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  if (!res.count) throw new AppError("NOT_FOUND");
  return { ok: true };
}

export async function restoreMedia(ctx: Ctx, input: { id: string }) {
  const res = await prisma.mediaAsset.updateMany({
    where: { id: input.id, ownerId: ctx.userId, deletedAt: { not: null } },
    data: { deletedAt: null },
  });
  if (!res.count) throw new AppError("NOT_FOUND");
  return { ok: true };
}

// ───────────── reference verification (used by saveDraft) ─────────────

type Ref = { assetId: string; url: string };

function collectRefs(content?: DraftContent, design?: DesignConfig): Ref[] {
  const refs: Ref[] = [];
  if (content) {
    const m = content.media;
    for (const r of [...m.couplePhotos, ...m.familyPhotos, ...m.gallery])
      refs.push({ assetId: r.assetId, url: r.url });
    if (m.video?.type === "UPLOAD") refs.push({ assetId: m.video.assetId, url: m.video.url });
    if (m.music?.type === "UPLOAD") refs.push({ assetId: m.music.assetId, url: m.music.url });
  }
  if (design?.background.type === "UPLOAD")
    refs.push({ assetId: design.background.assetId, url: design.background.url });
  return refs;
}

/**
 * Every media reference in a draft must be either a bundled demo asset or a live asset
 * uploaded to *this* invitation by *this* owner, with the exact stored URL.
 * Prevents embedding other people's uploads or arbitrary Cloudinary URLs.
 */
export async function assertOwnMediaRefs(
  ctx: Ctx,
  invitationId: string,
  content?: DraftContent,
  design?: DesignConfig,
) {
  const refs = collectRefs(content, design);
  const uploaded = refs.filter(
    (r) => !(r.assetId.startsWith("demo-") && r.url.startsWith("/templates/")),
  );
  if (!uploaded.length) return;
  const ids = [...new Set(uploaded.map((r) => r.assetId))];
  const rows = await prisma.mediaAsset.findMany({
    where: { id: { in: ids }, ownerId: ctx.userId, invitationId, deletedAt: null },
    select: { id: true, url: true },
  });
  const byId = new Map(rows.map((r) => [r.id, r.url]));
  const bad = uploaded.find((r) => byId.get(r.assetId) !== r.url);
  if (bad)
    throw new AppError(
      "VALIDATION",
      "A photo or file in this invitation is no longer available. Please re-upload it.",
      { media: ["Unknown media"] },
    );
}
