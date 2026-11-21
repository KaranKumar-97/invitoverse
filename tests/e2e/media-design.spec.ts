import { expect, test, type Page } from "@playwright/test";
import { makePng } from "../fixtures/images";
import {
  cleanup,
  createInvitationFor,
  createUserWithSession,
  prisma,
  sessionCookie,
} from "./fixtures";

let owner: Awaited<ReturnType<typeof createUserWithSession>>;

test.beforeAll(async () => {
  owner = await createUserWithSession("media");
});

test.afterAll(async () => {
  await cleanup([owner.user.id]);
  await prisma.$disconnect();
});

const card = (page: Page, title: string) =>
  page.locator("section").filter({ has: page.getByRole("heading", { name: title, exact: true }) });
const png = (name: string, w = 900, h = 600) => ({
  name,
  mimeType: "image/png",
  buffer: Buffer.from(makePng(w, h)),
});

test("upload gallery photos: progress, preview, persistence, rejection, undo", async ({
  page,
  context,
  baseURL,
}, info) => {
  test.skip(
    process.env.E2E_PROD === "1",
    "Uses the dev-only local media provider; production builds require Cloudinary.",
  );
  const id = (await createInvitationFor(owner.user.id)).id;
  await context.addCookies([sessionCookie(owner.sessionToken, baseURL!)]);
  await page.goto(`/dashboard/invitations/${id}/edit?tab=media`);
  await page.locator("[data-ready]").waitFor();

  const gallery = card(page, "Gallery");
  await gallery.getByRole("button", { name: "Remove samples" }).click();
  await gallery
    .locator('input[type="file"]')
    .setInputFiles([png("one.png"), png("two.png", 600, 900), png("three.png")]);

  const uploaded = gallery.locator('img[src^="/api/v1/media/local/"]');
  await expect(uploaded).toHaveCount(3, { timeout: 30_000 });
  await expect(gallery.getByRole("progressbar")).toHaveCount(0, { timeout: 10_000 });

  if (info.project.name === "desktop") {
    const frame = page.frameLocator('iframe[title="Invitation preview"]');
    await expect(frame.locator('#section-gallery img[src^="/api/v1/media/local/"]')).toHaveCount(
      3,
      { timeout: 15_000 },
    );
  }

  // Not an image → rejected before upload, with a clear message.
  await gallery
    .locator('input[type="file"]')
    .setInputFiles([{ name: "notes.gif", mimeType: "image/gif", buffer: Buffer.from("GIF89a") }]);
  await expect(gallery.getByText(/Unsupported file type/)).toBeVisible();

  // Saved and still there after reload.
  await expect(page.getByRole("status").filter({ hasText: /Saved/ }).first()).toBeVisible({
    timeout: 15_000,
  });
  await page.reload();
  await page.locator("[data-ready]").waitFor();
  await expect(card(page, "Gallery").locator('img[src^="/api/v1/media/local/"]')).toHaveCount(3);

  // Remove with undo.
  await card(page, "Gallery").getByRole("button", { name: "Remove photo" }).first().click();
  await expect(card(page, "Gallery").locator('img[src^="/api/v1/media/local/"]')).toHaveCount(2);
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(card(page, "Gallery").locator('img[src^="/api/v1/media/local/"]')).toHaveCount(3);
});

test("design changes show instantly in the live preview", async ({
  page,
  context,
  baseURL,
}, info) => {
  test.skip(
    info.project.name === "mobile",
    "Inline preview is a desktop feature; mobile uses the preview sheet.",
  );
  const id = (await createInvitationFor(owner.user.id)).id;
  await context.addCookies([sessionCookie(owner.sessionToken, baseURL!)]);
  await page.goto(`/dashboard/invitations/${id}/edit?tab=design`);
  await page.locator("[data-ready]").waitFor();
  const frame = page.frameLocator('iframe[title="Invitation preview"]');
  const root = frame.locator("[data-template]");
  await expect(root).toBeVisible({ timeout: 20_000 });

  await page.getByRole("radio", { name: /Emerald & Gold/ }).click();
  await expect
    .poll(async () => root.evaluate((el) => (el as HTMLElement).style.getPropertyValue("--c-bg")))
    .toBe("#0D2A22");

  await expect(frame.locator("#section-countdown")).toHaveCount(1);
  await page.getByRole("button", { name: "Hide Countdown" }).click();
  await expect(frame.locator("#section-countdown")).toHaveCount(0);

  await page.getByRole("button", { name: "Dramatic" }).click();
  await expect(page.getByRole("status").filter({ hasText: /Saved/ }).first()).toBeVisible({
    timeout: 15_000,
  });
  await page.reload();
  await page.locator("[data-ready]").waitFor();
  await expect(page.getByRole("radio", { name: /Emerald & Gold/ })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await expect(page.getByRole("button", { name: "Show Countdown" })).toBeVisible();
});
