import { rm } from "node:fs/promises";
import { join } from "node:path";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { AppError } from "@/lib/action-result";
import { prisma } from "@/server/db/prisma";
import { LOCAL_ROOT, verifyLocalToken, writeLocalFile } from "@/server/integrations/storage/local";
import * as inv from "@/server/services/invitations";
import * as media from "@/server/services/media";
import { makePng } from "../fixtures/images";
import { makeUser, resetDb } from "./helpers";

type Ctx = { userId: string };
let a: Ctx;
let b: Ctx;
let invitationId: string;
const users: string[] = [];

async function expectCode(p: Promise<unknown>, code: string) {
  await expect(p).rejects.toSatisfy((e: unknown) => e instanceof AppError && e.code === code);
}

/** Simulates the browser: sign → upload bytes (local provider) → confirm. */
async function upload(
  ctx: Ctx,
  invId: string,
  bytes = makePng(1200, 800),
  role: "GALLERY" | "COUPLE" = "GALLERY",
) {
  const ticket = await media.signUpload(ctx, {
    invitationId: invId,
    role,
    mimeType: "image/png",
    bytes: bytes.length,
  });
  expect(ticket.provider).toBe("LOCAL");
  const claims = verifyLocalToken(ticket.fields.token)!;
  await writeLocalFile(claims.key, bytes);
  return media.confirmUpload(ctx, { invitationId: invId, role, key: ticket.key });
}

beforeEach(async () => {
  await resetDb();
  a = { userId: (await makeUser("Alice")).id };
  b = { userId: (await makeUser("Bob")).id };
  users.push(a.userId, b.userId);
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

describe("uploads", () => {
  it("signs, verifies the stored file and records real dimensions", async () => {
    const dto = await upload(a, invitationId);
    expect(dto).toMatchObject({
      kind: "IMAGE",
      role: "GALLERY",
      width: 1200,
      height: 800,
      mimeType: "image/png",
    });
    expect(dto.url).toMatch(/^\/api\/v1\/media\/local\/vivah\//);
    expect((await media.listMedia(a, invitationId)).map((m) => m.id)).toEqual([dto.id]);
  });

  it("rejects wrong types/sizes before signing", async () => {
    await expectCode(
      media.signUpload(a, { invitationId, role: "GALLERY", mimeType: "image/svg+xml", bytes: 10 }),
      "VALIDATION",
    );
    await expectCode(
      media.signUpload(a, {
        invitationId,
        role: "GALLERY",
        mimeType: "image/png",
        bytes: 20 * 1024 * 1024,
      }),
      "VALIDATION",
    );
    await expectCode(
      media.signUpload(a, { invitationId, role: "MUSIC", mimeType: "image/png", bytes: 10 }),
      "VALIDATION",
    );
  });

  it("is owner-scoped: others can't sign for, confirm into, or delete your media", async () => {
    await expectCode(
      media.signUpload(b, { invitationId, role: "GALLERY", mimeType: "image/png", bytes: 100 }),
      "NOT_FOUND",
    );
    const ticket = await media.signUpload(a, {
      invitationId,
      role: "GALLERY",
      mimeType: "image/png",
      bytes: 100,
    });
    await expectCode(
      media.confirmUpload(b, { invitationId, role: "GALLERY", key: ticket.key }),
      "NOT_FOUND",
    );
    const dto = await upload(a, invitationId);
    await expectCode(media.deleteMedia(b, { id: dto.id }), "NOT_FOUND");
  });

  it("refuses to confirm a key outside the caller's folder", async () => {
    await expectCode(
      media.confirmUpload(a, {
        invitationId,
        role: "GALLERY",
        key: `vivah/${b.userId}/${invitationId}/abcdefghijkl.png`,
      }),
      "NOT_FOUND",
    );
  });

  it("rejects files whose contents aren't a readable image", async () => {
    const ticket = await media.signUpload(a, {
      invitationId,
      role: "GALLERY",
      mimeType: "image/png",
      bytes: 20,
    });
    await writeLocalFile(
      verifyLocalToken(ticket.fields.token)!.key,
      new TextEncoder().encode("not really a png file"),
    );
    await expectCode(
      media.confirmUpload(a, { invitationId, role: "GALLERY", key: ticket.key }),
      "VALIDATION",
    );
  });

  it("enforces the video quota", async () => {
    for (let i = 0; i < 2; i++) {
      await prisma.mediaAsset.create({
        data: {
          ownerId: a.userId,
          invitationId,
          kind: "VIDEO",
          role: "VIDEO",
          provider: "LOCAL",
          publicId: `v${i}`,
          url: `/x${i}`,
          bytes: 10,
        },
      });
    }
    await expectCode(
      media.signUpload(a, { invitationId, role: "VIDEO", mimeType: "video/mp4", bytes: 1000 }),
      "LIMIT_EXCEEDED",
    );
  });
});

describe("saveDraft media references", () => {
  it("accepts own uploads, rejects foreign, forged and deleted ones", async () => {
    const mine = await upload(a, invitationId);
    const ed = await inv.getInvitationForEditor(a, invitationId);
    const ref = { assetId: mine.id, url: mine.url, width: 1200, height: 800, alt: "" };
    const saved = await inv.saveDraft(a, {
      id: invitationId,
      draftUpdatedAt: ed.draftUpdatedAt,
      content: { ...ed.content, media: { ...ed.content.media, gallery: [ref] } },
    });

    // Someone else's asset (uploaded to another invitation)
    const otherInv = (
      await inv.createInvitation(b, {
        templateSlug: "royal-heritage",
        brideName: "X",
        groomName: "Y",
        order: "BRIDE_FIRST",
        weddingDate: "2027-01-01",
      })
    ).id;
    const theirs = await upload(b, otherInv);
    const foreign = { ...ref, assetId: theirs.id, url: theirs.url };
    await expectCode(
      inv.saveDraft(a, {
        id: invitationId,
        draftUpdatedAt: saved.draftUpdatedAt,
        content: { ...ed.content, media: { ...ed.content.media, gallery: [foreign] } },
      }),
      "VALIDATION",
    );

    // Own asset id with a swapped URL
    const forged = { ...ref, url: "https://res.cloudinary.com/someone/image/upload/x.jpg" };
    await expectCode(
      inv.saveDraft(a, {
        id: invitationId,
        draftUpdatedAt: saved.draftUpdatedAt,
        content: { ...ed.content, media: { ...ed.content.media, gallery: [forged] } },
      }),
      "VALIDATION",
    );

    // Deleted, then restored
    await media.deleteMedia(a, { id: mine.id });
    await expectCode(
      inv.saveDraft(a, {
        id: invitationId,
        draftUpdatedAt: saved.draftUpdatedAt,
        content: { ...ed.content, media: { ...ed.content.media, gallery: [ref] } },
      }),
      "VALIDATION",
    );
    await media.restoreMedia(a, { id: mine.id });
    await expect(
      inv.saveDraft(a, {
        id: invitationId,
        draftUpdatedAt: saved.draftUpdatedAt,
        content: { ...ed.content, media: { ...ed.content.media, gallery: [ref] } },
      }),
    ).resolves.toBeTruthy();
  });

  it("keeps bundled demo media working", async () => {
    const ed = await inv.getInvitationForEditor(a, invitationId);
    expect(ed.content.media.gallery.length).toBeGreaterThan(0);
    await expect(
      inv.saveDraft(a, {
        id: invitationId,
        draftUpdatedAt: ed.draftUpdatedAt,
        content: ed.content,
      }),
    ).resolves.toBeTruthy();
  });

  it("checks uploaded backgrounds in the design too", async () => {
    const ed = await inv.getInvitationForEditor(a, invitationId);
    const design = {
      ...ed.design,
      background: {
        type: "UPLOAD" as const,
        assetId: "nope",
        url: "/api/v1/media/local/vivah/x/y/abcdefghijkl.png",
      },
    };
    await expectCode(
      inv.saveDraft(a, { id: invitationId, draftUpdatedAt: ed.draftUpdatedAt, design }),
      "VALIDATION",
    );
  });
});
