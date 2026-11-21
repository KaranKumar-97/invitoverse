import { expect, test } from "@playwright/test";
import { cleanup, createUserWithSession, prisma, sessionCookie } from "./fixtures";

/**
 * The whole owner → guest journey through the real UI (docs/15 Phase 7, task 2):
 * create from the wizard → edit → publish → add a guest → the guest opens their link →
 * the owner sees "Opened".
 */
let owner: Awaited<ReturnType<typeof createUserWithSession>>;

test.beforeAll(async () => {
  owner = await createUserWithSession("journey");
});

test.afterAll(async () => {
  await cleanup([owner.user.id]);
  await prisma.$disconnect();
});

test("create → publish → personal link → guest opens → owner sees it", async ({
  page,
  context,
  baseURL,
  browser,
}, info) => {
  test.skip(
    info.project.name === "mobile",
    "One full run on desktop; screens are covered per spec.",
  );
  test.setTimeout(120_000);
  await context.addCookies([sessionCookie(owner.sessionToken, baseURL!)]);

  // 1. Wizard
  await page.goto("/dashboard/invitations/new");
  await page.getByRole("radio", { name: /Minimal Luxury/ }).click();
  await page.getByRole("button", { name: /Continue/ }).click();
  await page.getByLabel("Bride's first name").fill("Ira");
  await page.getByLabel("Groom's first name").fill("Neel");
  await page.getByLabel("Wedding date").fill("2027-12-12");
  await page.getByRole("button", { name: /Continue/ }).click();
  const slug = `ira-neel-${Date.now().toString(36)}`;
  await page.getByLabel("Invitation link").fill(slug);
  await page.getByRole("button", { name: "Create invitation" }).last().click();
  await page.waitForURL(/\/edit$/, { timeout: 30_000 });
  await page.locator("[data-ready]").waitFor();

  // 2. Publish
  await page.getByRole("button", { name: "Publish", exact: true }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Publish invitation" }).click();
  await expect(dialog.getByRole("button", { name: /Copy link/ })).toBeVisible({ timeout: 15_000 });
  await page.keyboard.press("Escape");

  // 3. Guest
  const inv = await prisma.invitation.findUniqueOrThrow({ where: { slug } });
  await page.goto(`/dashboard/invitations/${inv.id}/guests`);
  await page.getByRole("button", { name: "Add guest", exact: true }).first().click();
  await page.getByLabel("Name on the invitation").fill("Kapoor Family");
  await page.getByRole("button", { name: "Add guest", exact: true }).last().click();
  await expect(page.getByRole("button", { name: "Copy link for Kapoor Family" })).toBeVisible();
  const guest = await prisma.guest.findFirstOrThrow({ where: { invitationId: inv.id } });

  // 4. The guest opens their link in a fresh, signed-out browser.
  const guestCtx = await browser.newContext();
  const guestPage = await guestCtx.newPage();
  await guestPage.goto(`${baseURL}/i/${slug}/guest/${guest.token}`);
  await expect(guestPage.getByText(/Kapoor Family/).first()).toBeVisible();
  await guestPage.getByRole("button", { name: /Open Invitation/i }).click();
  await expect(guestPage.locator('[data-phase="open"]')).toBeAttached({ timeout: 15_000 });
  await guestCtx.close();

  // 5. Owner sees the open.
  await expect
    .poll(async () => (await prisma.guest.findUniqueOrThrow({ where: { id: guest.id } })).status)
    .toBe("OPENED");
  await page.reload();
  await expect(page.getByRole("row", { name: /Kapoor Family/ }).getByText("Opened")).toBeVisible();
});
