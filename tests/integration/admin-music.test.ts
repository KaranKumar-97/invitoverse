import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { AppError } from "@/lib/action-result";
import { prisma } from "@/server/db/prisma";
import * as svc from "@/server/services/admin-music";
import { makeUser, resetDb } from "./helpers";

async function expectCode(p: Promise<unknown>, code: string) {
  await expect(p).rejects.toSatisfy((e: unknown) => e instanceof AppError && e.code === code);
}

let superCtx: { userId: string };
let adminCtx: { userId: string };

beforeEach(async () => {
  await resetDb();
  await prisma.template.upsert({
    where: { slug: "mandir" },
    create: { slug: "mandir", name: "Mandir", category: "ROYAL" },
    update: { defaultTrackId: null },
  });
  for (const [i, id] of ["one", "two", "three"].entries())
    await prisma.musicTrack.create({
      data: { id, title: id, url: `/music/${id}.mp3`, sortOrder: (i + 1) * 10 },
    });
  const s = await makeUser("Super");
  const a = await makeUser("Admin");
  await prisma.user.update({ where: { id: s.id }, data: { role: "SUPERADMIN" } });
  await prisma.user.update({ where: { id: a.id }, data: { role: "ADMIN" } });
  superCtx = { userId: s.id };
  adminCtx = { userId: a.id };
});

afterAll(async () => {
  await resetDb();
  await prisma.$disconnect();
});

describe("admin music", () => {
  it("lets Admins list tracks but not change them", async () => {
    expect((await svc.listTracksAdmin(adminCtx)).tracks.map((t) => t.id)).toEqual([
      "one",
      "two",
      "three",
    ]);
    await expectCode(svc.setTrackActive(adminCtx, { id: "one", isActive: false }), "NOT_FOUND");
  });

  it("retires a track onto a replacement, re-pointing earlier replacements and defaults", async () => {
    await svc.setTemplateDefaultTrack(superCtx, { slug: "mandir", trackId: "two" });
    await svc.retireTrack(superCtx, { id: "one", replacedBy: "two" });
    await svc.retireTrack(superCtx, { id: "two", replacedBy: "three" });
    const rows = await prisma.musicTrack.findMany({ orderBy: { sortOrder: "asc" } });
    expect(rows.map((r) => [r.id, r.isActive, r.replacedBy])).toEqual([
      ["one", false, "three"],
      ["two", false, "three"],
      ["three", true, null],
    ]);
    const t = await prisma.template.findUniqueOrThrow({ where: { slug: "mandir" } });
    expect(t.defaultTrackId).toBe("three");
    expect(await prisma.adminAuditLog.count({ where: { action: "track.retired" } })).toBe(2);
  });

  it("rejects hidden replacements and hidden defaults", async () => {
    await svc.setTrackActive(superCtx, { id: "three", isActive: false });
    await expectCode(svc.retireTrack(superCtx, { id: "one", replacedBy: "three" }), "VALIDATION");
    await expectCode(
      svc.setTemplateDefaultTrack(superCtx, { slug: "mandir", trackId: "three" }),
      "VALIDATION",
    );
  });

  it("moves tracks and only accepts audio uploads within limits", async () => {
    await svc.moveTrack(superCtx, { id: "three", direction: "up" });
    expect((await svc.listTracksAdmin(superCtx)).tracks.map((t) => t.id)).toEqual([
      "one",
      "three",
      "two",
    ]);
    await expectCode(
      svc.signTrackUpload(superCtx, { mimeType: "video/mp4", bytes: 100 }),
      "VALIDATION",
    );
    await expectCode(
      svc.confirmTrackUpload(superCtx, {
        key: "invitoverse/someoneelse/library/abcdefghijkl.mp3",
        title: "X",
        artist: null,
        mood: "",
        licence: "OWNED",
        licenceNote: null,
        durationSec: 10,
      }),
      "NOT_FOUND",
    );
  });
});
