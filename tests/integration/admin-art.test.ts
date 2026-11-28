import { existsSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { AppError } from "@/lib/action-result";
import { prisma } from "@/server/db/prisma";
import * as svc from "@/server/services/admin-art";
import { artSlots, ART_TEMPLATES, artUrl, isArtFile } from "@/server/services/template-art";
import { makeUser, resetDb } from "./helpers";

async function expectCode(p: Promise<unknown>, code: string) {
  await expect(p).rejects.toSatisfy((e: unknown) => e instanceof AppError && e.code === code);
}

let superCtx: { userId: string };
let adminCtx: { userId: string };

beforeEach(async () => {
  await resetDb();
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

describe("template art", () => {
  it("lists every art file each template uses, and each exists in /public", () => {
    for (const slug of ART_TEMPLATES) {
      const slots = artSlots(slug);
      expect(slots.length, slug).toBeGreaterThan(0);
      for (const s of slots)
        expect(
          existsSync(path.join(process.cwd(), "public/templates", slug, "art", s.file)),
          `${slug}/${s.file}`,
        ).toBe(true);
    }
    expect(isArtFile("kashi", "ghats.webp")).toBe(true);
    expect(isArtFile("kashi", "../secret.webp")).toBe(false);
    expect(isArtFile("kashi", "nope.webp")).toBe(false);
  });

  it("serves the original unless replaced", async () => {
    expect(await artUrl("kashi", "ghats.webp")).toBe("/templates/kashi/art/ghats.webp");
  });

  it("needs assets.template_art to replace or reset, and audits resets", async () => {
    expect((await svc.listTemplateArtAdmin(adminCtx)).length).toBe(ART_TEMPLATES.length);
    await expectCode(
      svc.signArtUpload(adminCtx, {
        slug: "kashi",
        file: "ghats.webp",
        mimeType: "image/webp",
        bytes: 10,
      }),
      "NOT_FOUND",
    );
    await expectCode(
      svc.signArtUpload(superCtx, {
        slug: "kashi",
        file: "ghats.webp",
        mimeType: "image/gif",
        bytes: 10,
      }),
      "VALIDATION",
    );
    await expectCode(
      svc.signArtUpload(superCtx, {
        slug: "kashi",
        file: "missing.webp",
        mimeType: "image/webp",
        bytes: 10,
      }),
      "NOT_FOUND",
    );
    await svc.resetArt(superCtx, { slug: "kashi", file: "ghats.webp" });
    expect(await prisma.adminAuditLog.count({ where: { action: "asset.reset" } })).toBe(1);
  });
});
