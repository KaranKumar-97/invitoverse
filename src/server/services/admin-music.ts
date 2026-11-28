import "server-only";
import { customAlphabet } from "nanoid";
import { AppError } from "@/lib/action-result";
import { MEDIA_RULES, type UploadTicket } from "@/lib/media";
import { prisma } from "@/server/db/prisma";
import { getMediaStorage } from "@/server/integrations/storage";
import { isTemplateSlug, templateManifests, TEMPLATE_SLUGS } from "@/templates/registry";
import { assertPermission, recordAudit } from "./admin-access";
import type { Ctx } from "./context";
import { invalidateMusic } from "./music";

/**
 * Music library management for all templates (docs/19 §4.6). Reads need assets.view; every
 * change needs assets.music and is audited. Retired / hidden tracks keep playing on invitations
 * that already use them.
 */

export type Licence = "OWNED" | "LICENSED" | "ROYALTY_FREE" | "UNLICENSED";

export async function listTracksAdmin(ctx: Ctx) {
  await assertPermission(ctx, "assets.view");
  const [tracks, templates, usage] = await Promise.all([
    prisma.musicTrack.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.template.findMany({
      where: { slug: { in: TEMPLATE_SLUGS } },
      select: { slug: true, defaultTrackId: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.$queryRaw<Array<{ trackId: string; n: bigint }>>`
      SELECT "draftContent"->'media'->'music'->>'trackId' AS "trackId", COUNT(*) AS n
      FROM "Invitation"
      WHERE "draftContent"->'media'->'music'->>'type' = 'LIBRARY'
      GROUP BY 1`,
  ]);
  const used = new Map(usage.map((u) => [u.trackId, Number(u.n)]));
  return {
    tracks: tracks.map((t) => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      mood: t.mood,
      url: t.url,
      provider: t.provider,
      durationSec: t.durationSec,
      licence: t.licence as Licence,
      licenceNote: t.licenceNote,
      isActive: t.isActive,
      replacedBy: t.replacedBy,
      usedBy: used.get(t.id) ?? 0,
    })),
    templates: templates
      .filter((t) => isTemplateSlug(t.slug))
      .map((t) => {
        const m = templateManifests[t.slug as keyof typeof templateManifests];
        return {
          slug: t.slug,
          name: m.name,
          defaultTrackId: t.defaultTrackId,
          manifestDefault: m.defaultMusicTrackId,
        };
      }),
  };
}

async function findTrack(id: string) {
  const t = await prisma.musicTrack.findUnique({ where: { id } });
  if (!t) throw new AppError("NOT_FOUND");
  return t;
}

async function audit(actorId: string, action: string, targetId: string, after?: object) {
  await prisma.$transaction((tx) =>
    recordAudit(tx, {
      actorId,
      action,
      targetType: "track",
      targetId,
      after: after as never,
    }),
  );
}

/** Edit a track's details. */
export async function updateTrack(
  ctx: Ctx,
  input: {
    id: string;
    title: string;
    artist: string | null;
    mood: string;
    licence: Licence;
    licenceNote: string | null;
  },
) {
  await assertPermission(ctx, "assets.music");
  await findTrack(input.id);
  const { id, ...data } = input;
  await prisma.musicTrack.update({ where: { id }, data });
  await audit(ctx.userId, "track.updated", id, data);
  invalidateMusic();
  return { ok: true };
}

/** Show or hide a track in the editor's picker. */
export async function setTrackActive(ctx: Ctx, input: { id: string; isActive: boolean }) {
  await assertPermission(ctx, "assets.music");
  const t = await findTrack(input.id);
  if (input.isActive && t.replacedBy)
    throw new AppError("VALIDATION", "Restore this track before showing it.");
  await prisma.musicTrack.update({ where: { id: t.id }, data: { isActive: input.isActive } });
  await audit(ctx.userId, input.isActive ? "track.shown" : "track.hidden", t.id);
  invalidateMusic();
  return { ok: true };
}

/** Move one place up or down in the picker. */
export async function moveTrack(ctx: Ctx, input: { id: string; direction: "up" | "down" }) {
  await assertPermission(ctx, "assets.music");
  const rows = await prisma.musicTrack.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true },
  });
  const i = rows.findIndex((r) => r.id === input.id);
  if (i < 0) throw new AppError("NOT_FOUND");
  const j = input.direction === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= rows.length) return { ok: true };
  const order = rows.map((r) => r.id);
  [order[i], order[j]] = [order[j]!, order[i]!];
  await prisma.$transaction(
    order.map((id, n) =>
      prisma.musicTrack.update({ where: { id }, data: { sortOrder: (n + 1) * 10 } }),
    ),
  );
  await audit(ctx.userId, "track.reordered", input.id, { direction: input.direction });
  invalidateMusic();
  return { ok: true };
}

/** Retire a track: hidden, and invitations using it play `replacedBy` instead. */
export async function retireTrack(ctx: Ctx, input: { id: string; replacedBy: string }) {
  await assertPermission(ctx, "assets.music");
  const t = await findTrack(input.id);
  if (input.replacedBy === t.id) throw new AppError("VALIDATION", "Pick a different track.");
  const r = await findTrack(input.replacedBy);
  if (!r.isActive || r.replacedBy)
    throw new AppError("VALIDATION", "The replacement must be a track that's shown.");
  // Point anything already replaced by this track at the new replacement too (no chains).
  await prisma.$transaction([
    prisma.musicTrack.update({
      where: { id: t.id },
      data: { isActive: false, replacedBy: r.id },
    }),
    prisma.musicTrack.updateMany({ where: { replacedBy: t.id }, data: { replacedBy: r.id } }),
    prisma.template.updateMany({ where: { defaultTrackId: t.id }, data: { defaultTrackId: r.id } }),
  ]);
  await audit(ctx.userId, "track.retired", t.id, { replacedBy: r.id });
  invalidateMusic();
  return { ok: true };
}

/** Undo a retirement (stays hidden until shown again). */
export async function restoreTrack(ctx: Ctx, input: { id: string }) {
  await assertPermission(ctx, "assets.music");
  const t = await findTrack(input.id);
  await prisma.musicTrack.update({ where: { id: t.id }, data: { replacedBy: null } });
  await audit(ctx.userId, "track.restored", t.id);
  invalidateMusic();
  return { ok: true };
}

/** The song new invitations of a template start with (null = the template's built-in default). */
export async function setTemplateDefaultTrack(
  ctx: Ctx,
  input: { slug: string; trackId: string | null },
) {
  await assertPermission(ctx, "assets.music");
  if (!isTemplateSlug(input.slug)) throw new AppError("NOT_FOUND");
  if (input.trackId) {
    const t = await findTrack(input.trackId);
    if (!t.isActive || t.replacedBy)
      throw new AppError("VALIDATION", "Pick a track that's shown in the picker.");
  }
  await prisma.template.update({
    where: { slug: input.slug },
    data: { defaultTrackId: input.trackId },
  });
  await audit(ctx.userId, "track.template_default", input.slug, { trackId: input.trackId });
  return { ok: true };
}

// ───────────── Upload ─────────────

const keyId = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 12);
// Matches the storage key format (invitoverse/<user>/<folder>/<id>.<ext>, letters and digits).
const prefix = (ctx: Ctx) => `invitoverse/${ctx.userId}/library/`;

/** Step 1: a signed, single-object ticket for an audio file (stored under the admin's folder). */
export async function signTrackUpload(
  ctx: Ctx,
  input: { mimeType: string; bytes: number },
): Promise<UploadTicket> {
  await assertPermission(ctx, "assets.music");
  const rule = MEDIA_RULES.AUDIO;
  const ext = rule.mimes[input.mimeType];
  if (!ext) throw new AppError("VALIDATION", `Unsupported file. Use ${rule.label}.`);
  if (input.bytes > rule.maxBytes) throw new AppError("VALIDATION", `Use ${rule.label}.`);
  const storage = getMediaStorage();
  const base = `${prefix(ctx)}${keyId()}`;
  const key = storage.provider === "LOCAL" ? `${base}.${ext}` : base;
  return storage.createUploadTicket({
    key,
    kind: "AUDIO",
    mimeType: input.mimeType,
    maxBytes: rule.maxBytes,
  });
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "track";

/** Step 2: verify the stored file and add it to the library (shown at the end of the list). */
export async function confirmTrackUpload(
  ctx: Ctx,
  input: {
    key: string;
    title: string;
    artist: string | null;
    mood: string;
    licence: Licence;
    licenceNote: string | null;
    durationSec: number;
  },
) {
  await assertPermission(ctx, "assets.music");
  if (!input.key.startsWith(prefix(ctx)) || input.key.includes(".."))
    throw new AppError("NOT_FOUND");
  const storage = getMediaStorage();
  const info = await storage.inspect(input.key, "AUDIO");
  if (!info) throw new AppError("NOT_FOUND", "We couldn't find that upload. Please try again.");
  const rule = MEDIA_RULES.AUDIO;
  if (!Object.keys(rule.mimes).includes(info.mimeType) || info.bytes > rule.maxBytes) {
    await storage.remove(input.key, "AUDIO").catch(() => {});
    throw new AppError("VALIDATION", `Unsupported file. Use ${rule.label}.`);
  }
  let id = slugify(input.title);
  if (await prisma.musicTrack.findUnique({ where: { id } })) id = `${id}-${keyId().slice(0, 4)}`;
  const last = await prisma.musicTrack.findFirst({ orderBy: { sortOrder: "desc" } });
  await prisma.musicTrack.create({
    data: {
      id,
      title: input.title,
      artist: input.artist,
      mood: input.mood,
      licence: input.licence,
      licenceNote: input.licenceNote,
      url: info.url,
      provider: storage.provider,
      publicId: input.key,
      durationSec: Math.round(info.durationSec ?? input.durationSec),
      sortOrder: (last?.sortOrder ?? 0) + 10,
      createdBy: ctx.userId,
    },
  });
  await audit(ctx.userId, "track.added", id, { title: input.title, licence: input.licence });
  invalidateMusic();
  return { id };
}
