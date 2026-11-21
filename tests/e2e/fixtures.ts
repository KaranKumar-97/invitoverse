import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { defaultDesign } from "@/lib/invitation/defaults";
import { toPublishable } from "@/lib/invitation/publishable";
import { DraftContentSchema, InvitationContentSchema } from "@/lib/invitation/schema";
import { templateDemos, templateManifests } from "@/templates/registry";

/**
 * E2E fixtures write directly to the database the dev server uses (DATABASE_URL in .env),
 * creating throwaway users/sessions so tests don't depend on email delivery.
 */
export const prisma = new PrismaClient();

export async function createUserWithSession(label: string) {
  const tag = `${label}-${Date.now()}-${randomBytes(3).toString("hex")}`;
  const user = await prisma.user.create({
    data: { email: `e2e-${tag}@test.local`, name: `E2E ${label}` },
  });
  const sessionToken = randomBytes(32).toString("hex");
  await prisma.session.create({
    data: { sessionToken, userId: user.id, expires: new Date(Date.now() + 86400_000) },
  });
  return { user, sessionToken };
}

export async function createInvitationFor(userId: string) {
  const slug = `e2e-${randomBytes(4).toString("hex")}`;
  const content = DraftContentSchema.parse(
    InvitationContentSchema.parse(templateDemos["royal-heritage"].content),
  );
  content.couple.bride.firstName = "Asha";
  content.couple.groom.firstName = "Dev";
  return prisma.invitation.create({
    data: {
      ownerId: userId,
      templateSlug: "royal-heritage",
      slug,
      title: "Asha & Dev Wedding",
      draftContent: content as object,
      draftDesign: defaultDesign(templateManifests["royal-heritage"]) as object,
    },
  });
}

export async function cleanup(userIds: string[]) {
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}

export const sessionCookie = (token: string, baseURL: string) => ({
  name: "authjs.session-token",
  value: token,
  url: baseURL,
  httpOnly: true,
  sameSite: "Lax" as const,
});

/** Publishes the current draft exactly like the service does (strict snapshot). */
export async function publishFor(id: string) {
  const row = await prisma.invitation.findUniqueOrThrow({ where: { id } });
  const strict = toPublishable(DraftContentSchema.parse(row.draftContent));
  if (!strict.ok) throw new Error("fixture draft is not publishable");
  await prisma.invitation.update({
    where: { id },
    data: {
      status: "PUBLISHED",
      publishedTemplateSlug: row.templateSlug,
      publishedContent: strict.content as object,
      publishedDesign: row.draftDesign as object,
      publishedVersion: { increment: 1 },
      publishedAt: new Date(),
    },
  });
}
