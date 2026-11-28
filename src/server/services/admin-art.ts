import "server-only";
import { customAlphabet } from "nanoid";
import { AppError } from "@/lib/action-result";
import type { UploadTicket } from "@/lib/media";
import { prisma } from "@/server/db/prisma";
import { getMediaStorage } from "@/server/integrations/storage";
import { templateManifests } from "@/templates/registry";
import { assertPermission, recordAudit } from "./admin-access";
import type { Ctx } from "./context";
import { ART_TEMPLATES, artSlots, invalidateArt } from "./template-art";

/**
 * Template art replacement (docs/19 §4.6). View needs assets.view; replace / reset needs
 * assets.template_art. A replacement must keep the original's shape (±3% aspect ratio), because
 * layouts measure the art (arch slices, the floating diya, …).
 */

type Licence = "OWNED" | "LICENSED" | "ROYALTY_FREE" | "UNLICENSED";

const IMAGE_MIMES: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
};
const VIDEO_MIMES: Record<string, string> = { "video/mp4": "mp4" };
const MAX_IMAGE = 8 * 1024 * 1024;
const MAX_VIDEO = 20 * 1024 * 1024;

export async function listTemplateArtAdmin(ctx: Ctx) {
  await assertPermission(ctx, "assets.view");
  const overrides = await prisma.templateAssetOverride.findMany();
  return ART_TEMPLATES.map((slug) => ({
    slug,
    name: templateManifests[slug as keyof typeof templateManifests]?.name ?? slug,
    slots: artSlots(slug).map((s) => {
      const o = overrides.find((r) => r.templateSlug === slug && r.file === s.file);
      return {
        ...s,
        original: `/templates/${slug}/art/${s.file}`,
        replacement: o
          ? { url: o.url, width: o.width, height: o.height, licence: o.licence }
          : null,
      };
    }),
  }));
}

function slotFor(slug: string, file: string) {
  const slot = artSlots(slug).find((s) => s.file === file);
  if (!slot) throw new AppError("NOT_FOUND");
  return slot;
}

const keyId = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 12);
const prefix = (ctx: Ctx) => `invitoverse/${ctx.userId}/tplart/`;

export async function signArtUpload(
  ctx: Ctx,
  input: { slug: string; file: string; mimeType: string; bytes: number },
): Promise<UploadTicket> {
  await assertPermission(ctx, "assets.template_art");
  const slot = slotFor(input.slug, input.file);
  const mimes = slot.video ? VIDEO_MIMES : IMAGE_MIMES;
  const ext = mimes[input.mimeType];
  const max = slot.video ? MAX_VIDEO : MAX_IMAGE;
  if (!ext)
    throw new AppError("VALIDATION", slot.video ? "Use an MP4 video." : "Use a WebP, JPG or PNG.");
  if (input.bytes > max)
    throw new AppError("VALIDATION", `Keep it under ${Math.round(max / 1048576)} MB.`);
  const storage = getMediaStorage();
  const base = `${prefix(ctx)}${keyId()}`;
  return storage.createUploadTicket({
    key: storage.provider === "LOCAL" ? `${base}.${ext}` : base,
    kind: slot.video ? "VIDEO" : "IMAGE",
    mimeType: input.mimeType,
    maxBytes: max,
  });
}

export async function confirmArtUpload(
  ctx: Ctx,
  input: { slug: string; file: string; key: string; licence: Licence },
) {
  await assertPermission(ctx, "assets.template_art");
  const slot = slotFor(input.slug, input.file);
  if (!input.key.startsWith(prefix(ctx)) || input.key.includes(".."))
    throw new AppError("NOT_FOUND");
  const storage = getMediaStorage();
  const kind = slot.video ? "VIDEO" : "IMAGE";
  const info = await storage.inspect(input.key, kind);
  if (!info) throw new AppError("NOT_FOUND", "We couldn't find that upload. Please try again.");
  const allowed = slot.video ? VIDEO_MIMES : IMAGE_MIMES;
  const reject = async (message: string) => {
    await storage.remove(input.key, kind).catch(() => {});
    throw new AppError("VALIDATION", message);
  };
  if (!allowed[info.mimeType]) await reject("That file type isn't supported here.");
  if (!slot.video && slot.width && slot.height) {
    if (!info.width || !info.height) await reject("We couldn't read that image.");
    const want = slot.width / slot.height;
    const got = info.width! / info.height!;
    if (Math.abs(got - want) / want > 0.03)
      await reject(
        `Use the same shape as the original (${slot.width}×${slot.height}); this one is ${info.width}×${info.height}.`,
      );
  }
  const data = {
    url: info.url,
    provider: storage.provider,
    publicId: input.key,
    width: info.width,
    height: info.height,
    licence: input.licence,
    updatedBy: ctx.userId,
  };
  await prisma.$transaction(async (tx) => {
    await tx.templateAssetOverride.upsert({
      where: { templateSlug_file: { templateSlug: input.slug, file: input.file } },
      create: { templateSlug: input.slug, file: input.file, ...data },
      update: data,
    });
    await recordAudit(tx, {
      actorId: ctx.userId,
      action: "asset.replaced",
      targetType: "asset",
      targetId: `${input.slug}/${input.file}`,
      after: { licence: input.licence, width: info.width, height: info.height },
    });
  });
  invalidateArt();
  return { ok: true };
}

export async function resetArt(ctx: Ctx, input: { slug: string; file: string }) {
  await assertPermission(ctx, "assets.template_art");
  slotFor(input.slug, input.file);
  await prisma.$transaction(async (tx) => {
    await tx.templateAssetOverride.deleteMany({
      where: { templateSlug: input.slug, file: input.file },
    });
    await recordAudit(tx, {
      actorId: ctx.userId,
      action: "asset.reset",
      targetType: "asset",
      targetId: `${input.slug}/${input.file}`,
    });
  });
  invalidateArt();
  return { ok: true };
}
