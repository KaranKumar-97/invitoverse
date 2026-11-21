import { expect, test } from "@playwright/test";
import {
  cleanup,
  createInvitationFor,
  createUserWithSession,
  prisma,
  publishFor,
  sessionCookie,
} from "./fixtures";

let owner: Awaited<ReturnType<typeof createUserWithSession>>;

test.beforeAll(async () => {
  owner = await createUserWithSession("publisher");
});

test.afterAll(async () => {
  await cleanup([owner.user.id]);
  await prisma.$disconnect();
});

test("publish → live page; edits stay private until 'Publish changes'; unpublish → 404", async ({
  page,
  context,
  baseURL,
  request,
}, info) => {
  test.skip(
    info.project.name === "mobile",
    "Covered on desktop; the publish dialog is the same component on mobile.",
  );
  const { id, slug } = await createInvitationFor(owner.user.id);

  // Draft: not public.
  expect((await request.get(`/i/${slug}`)).status()).toBe(404);
  expect((await request.get(`/api/og/${slug}`)).status()).toBe(404);

  await context.addCookies([sessionCookie(owner.sessionToken, baseURL!)]);
  await page.goto(`/dashboard/invitations/${id}/edit`);
  await page.locator("[data-ready]").waitFor();

  // Publish from the editor.
  await page.getByRole("button", { name: "Publish", exact: true }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("Before you publish")).toBeVisible({ timeout: 15_000 });
  await dialog.getByRole("button", { name: "Publish invitation" }).click();
  await expect(dialog.getByRole("button", { name: /Copy link/ })).toBeVisible({ timeout: 15_000 });
  await expect(dialog.getByText(`/i/${slug}`)).toBeVisible();
  await page.keyboard.press("Escape");

  // Live for anyone (fresh, signed-out request).
  const live = await request.get(`/i/${slug}`);
  expect(live.status()).toBe(200);
  const html = await live.text();
  expect(html).toContain("Asha");
  expect(html).toMatch(/<meta name="robots" content="noindex, nofollow"/);
  expect(html).toContain(`/api/og/${slug}?v=1`);
  expect(live.headers()["referrer-policy"]).toBe("no-referrer");

  const og = await request.get(`/api/og/${slug}?v=1`);
  expect(og.status()).toBe(200);
  expect(og.headers()["content-type"]).toContain("image/png");

  const content = (await prisma.invitation.findUniqueOrThrow({ where: { id } }))
    .publishedContent as { events: Array<{ id: string }> };
  const ics = await request.get(`/api/v1/ics/${slug}/${content.events[0].id}`);
  expect(ics.status()).toBe(200);
  expect(ics.headers()["content-type"]).toContain("text/calendar");
  expect(await ics.text()).toMatch(/DTSTART:\d{8}T\d{6}Z/);

  // Edit after publishing → still the old version publicly.
  await page.locator("#bride-first").fill("Ashwini");
  await expect(page.getByRole("status").filter({ hasText: /Saved/ }).first()).toBeVisible({
    timeout: 15_000,
  });
  expect(await (await request.get(`/i/${slug}`)).text()).not.toContain("Ashwini");

  // Publish changes.
  await page.getByRole("button", { name: "Publish changes" }).first().click();
  await dialog.getByRole("button", { name: "Publish changes" }).click();
  await expect(dialog.getByText("Version 2")).toBeVisible({ timeout: 15_000 });
  await expect
    .poll(async () => (await request.get(`/i/${slug}`)).text(), { timeout: 10_000 })
    .toContain("Ashwini");

  // Unpublish → gone.
  await dialog.getByRole("button", { name: "Unpublish" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Unpublish" }).click();
  await expect(dialog.getByText("Before you publish")).toBeVisible({ timeout: 15_000 });
  await expect
    .poll(async () => (await request.get(`/i/${slug}`)).status(), { timeout: 10_000 })
    .toBe(404);
});

test("public invitation counts an open when the guest taps Open", async ({ page }, info) => {
  test.skip(info.project.name === "mobile", "Desktop is enough for the beacon.");
  const { id, slug } = await createInvitationFor(owner.user.id);
  await publishFor(id);
  await page.goto(`/i/${slug}`);
  await page.getByRole("button", { name: /Open Invitation/i }).click();
  await expect
    .poll(async () => (await prisma.invitation.findUniqueOrThrow({ where: { id } })).openCount, {
      timeout: 10_000,
    })
    .toBe(1);
  await page.reload();
  await page.getByRole("button", { name: /Open Invitation/i }).click();
  await page.waitForTimeout(1000);
  expect((await prisma.invitation.findUniqueOrThrow({ where: { id } })).openCount).toBe(1); // once per session
});
