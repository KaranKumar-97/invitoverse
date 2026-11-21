import { expect, test } from "@playwright/test";
import {
  cleanup,
  createInvitationFor,
  createUserWithSession,
  prisma,
  sessionCookie,
} from "./fixtures";

let owner: Awaited<ReturnType<typeof createUserWithSession>>;
let intruder: Awaited<ReturnType<typeof createUserWithSession>>;
let invitationId: string;

test.beforeAll(async () => {
  owner = await createUserWithSession("owner");
  intruder = await createUserWithSession("intruder");
  invitationId = (await createInvitationFor(owner.user.id)).id;
});

test.afterAll(async () => {
  await cleanup([owner.user.id, intruder.user.id]);
  await prisma.$disconnect();
});

test("signed-out visitors are sent to sign in", async ({ page }) => {
  await page.goto(`/dashboard/invitations/${invitationId}/edit`);
  await expect(page).toHaveURL(/\/login\?callbackUrl=/);
});

test("another owner gets 404 for the editor and the preview", async ({
  page,
  context,
  baseURL,
}) => {
  await context.addCookies([sessionCookie(intruder.sessionToken, baseURL!)]);
  const editor = await page.goto(`/dashboard/invitations/${invitationId}/edit`);
  expect(editor?.status()).toBe(404);
  const preview = await page.goto(`/preview/${invitationId}`);
  expect(preview?.status()).toBe(404);
  await expect(page.getByText("Asha")).toHaveCount(0);
});

test("owner edits, the preview updates live, and the change survives a reload", async ({
  page,
  context,
  baseURL,
}, info) => {
  const own = (await createInvitationFor(owner.user.id)).id; // separate invitation per project (runs in parallel)
  await context.addCookies([sessionCookie(owner.sessionToken, baseURL!)]);
  await page.goto(`/dashboard/invitations/${own}/edit`);
  await expect(page.getByRole("heading", { name: "Asha & Dev Wedding" })).toBeVisible();
  await page.locator("[data-ready]").waitFor();

  const name = page.locator("#bride-first");
  await name.fill("Ashalata");

  // Live preview (desktop shows it inline; mobile opens it from the bottom bar).
  if (info.project.name === "mobile")
    await page.getByRole("button", { name: "Preview" }).last().click();
  const frame = page.frameLocator('iframe[title="Invitation preview"]');
  await expect(frame.getByText(/Ashalata & Dev/i).first()).toBeVisible({ timeout: 20_000 });
  if (info.project.name === "mobile") await page.keyboard.press("Escape");

  await expect(page.getByRole("status").filter({ hasText: /Saved/ }).first()).toBeVisible({
    timeout: 10_000,
  });
  await page.reload();
  await expect(page.locator("#bride-first")).toHaveValue("Ashalata");
});
