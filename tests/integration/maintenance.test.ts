import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import { join } from "node:path";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/server/db/prisma";
import { LOCAL_ROOT, verifyLocalToken, writeLocalFile } from "@/server/integrations/storage/local";
import * as inv from "@/server/services/invitations";
import { checkDatabase, purgeDeleted, runMediaCleanup } from "@/server/services/maintenance";
import * as media from "@/server/services/media";
import { makePng } from "../fixtures/images";
import { makeUser, resetDb } from "./helpers";

const DAY = 86_400_000;
type Ctx = { userId: string };
let a: Ctx;
let invitationId: string;
const users: string[] = [];

async function upload(ctx: Ctx, invId: string) {
  const bytes = makePng(400, 300);
  const ticket = await media.signUpload(ctx, {
    invitationId: invId,
    role: "GALLERY",
    mimeType: "image/png",
    bytes: bytes.length,
  });
  const claims = verifyLocalToken(ticket.fields.token)!;
  await writeLocalFile(claims.key, bytes);
  const dto = await media.confirmUpload(ctx, {
    invitationId: invId,
    role: "GALLERY",
    key: ticket.key,
  });
  const row = await prisma.mediaAsset.findUniqueOrThrow({ where: { id: dto.id } });
  return { ...dto, file: join(LOCAL_ROOT, row.publicId) };
}

const ago = (ms: number) => new Date(Date.now() - ms);

beforeEach(async () => {
  await resetDb();
  a = { userId: (await makeUser("Maint")).id };
  users.push(a.userId);
  invitationId = (
    await inv.createInvitation(a, {
      templateSlug: "royal-heritage",
      brideName: "Priya",
      groomName: "Rahul",
      order: "BRIDE_FIRST",
      weddingDate: "2027-02-14",
    })
  ).id;
});

afterAll(async () => {
  for (const u of users) await rm(join(LOCAL_ROOT, "vivah", u), { recursive: true, force: true });
  await resetDb();
  await prisma.$disconnect();
});

describe("media cleanup", () => {
  it("removes files and rows deleted over 24 h ago, but not recent deletes or live media", async () => {
    const old = await upload(a, invitationId);
    const recent = await upload(a, invitationId);
    const live = await upload(a, invitationId);
    await prisma.mediaAsset.update({ where: { id: old.id }, data: { deletedAt: ago(2 * DAY) } });
    await prisma.mediaAsset.update({
      where: { id: recent.id },
      data: { deletedAt: ago(3600_000) },
    });
    await prisma.mediaAsset.update({ where: { id: live.id }, data: { deletedAt: ago(2 * DAY) } });
    expect(existsSync(old.file)).toBe(true);

    const result = await runMediaCleanup();
    expect(result).toMatchObject({ removed: 2, kept: 0, failed: 0 });
    expect(existsSync(old.file)).toBe(false);
    expect(existsSync(recent.file)).toBe(true);
    expect(await prisma.mediaAsset.count({ where: { id: recent.id } })).toBe(1);
  });

  it("keeps deleted media that a published invitation still shows", async () => {
    const photo = await upload(a, invitationId);
    await prisma.mediaAsset.update({ where: { id: photo.id }, data: { deletedAt: ago(2 * DAY) } });
    await prisma.invitation.update({
      where: { id: invitationId },
      data: {
        status: "PUBLISHED",
        publishedContent: { media: { gallery: [{ assetId: photo.id, url: photo.url }] } },
        publishedDesign: {},
      },
    });
    expect(await runMediaCleanup()).toMatchObject({ removed: 0, kept: 1 });
    expect(existsSync(photo.file)).toBe(true);
  });

  it("removes orphans (no invitation) after 7 days", async () => {
    const orphan = await upload(a, invitationId);
    await prisma.mediaAsset.update({
      where: { id: orphan.id },
      data: { invitationId: null, createdAt: ago(8 * DAY) },
    });
    expect(await runMediaCleanup()).toMatchObject({ removed: 1 });
    expect(existsSync(orphan.file)).toBe(false);
  });
});

describe("purge", () => {
  it("hard-deletes accounts soft-deleted over 30 days ago, with their files", async () => {
    const photo = await upload(a, invitationId);
    const keep = await makeUser("Keep");
    users.push(keep.id);
    await prisma.user.update({ where: { id: a.userId }, data: { deletedAt: ago(31 * DAY) } });
    await prisma.user.update({ where: { id: keep.id }, data: { deletedAt: ago(5 * DAY) } });

    const result = await purgeDeleted();
    expect(result.users).toBe(1);
    expect(await prisma.user.count({ where: { id: a.userId } })).toBe(0);
    expect(await prisma.invitation.count({ where: { id: invitationId } })).toBe(0);
    expect(existsSync(photo.file)).toBe(false);
    expect(await prisma.user.count({ where: { id: keep.id } })).toBe(1);
  });

  it("clears expired sessions and magic-link tokens", async () => {
    await prisma.session.create({
      data: { sessionToken: "expired-session", userId: a.userId, expires: ago(DAY) },
    });
    await prisma.session.create({
      data: { sessionToken: "live-session", userId: a.userId, expires: new Date(Date.now() + DAY) },
    });
    await prisma.verificationToken.create({
      data: { identifier: "x@test.local", token: "old-token", expires: ago(DAY) },
    });
    const result = await purgeDeleted();
    expect(result.sessions).toBe(1);
    expect(result.verificationTokens).toBeGreaterThanOrEqual(1);
    expect(await prisma.session.count({ where: { sessionToken: "live-session" } })).toBe(1);
  });

  it("health check pings the database", async () => {
    expect(await checkDatabase()).toBe(true);
  });
});
