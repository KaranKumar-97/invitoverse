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
  owner = await createUserWithSession("guests");
});

test.afterAll(async () => {
  await cleanup([owner.user.id]);
  await prisma.$disconnect();
});

test("personal links: privacy, status lifecycle, regenerate, unpublish", async ({
  page,
  context,
  baseURL,
  browser,
  request,
}, info) => {
  test.skip(
    info.project.name === "mobile",
    "Run once on desktop; mobile layout is checked separately.",
  );
  const { id, slug } = await createInvitationFor(owner.user.id);
  await publishFor(id);
  const draft = (await prisma.invitation.findUniqueOrThrow({ where: { id } })).draftContent as {
    events: Array<{ id: string; name: string; venue: { name: string } }>;
  };
  const [mehndi, sangeet, wedding, reception] = draft.events;

  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await context.addCookies([sessionCookie(owner.sessionToken, baseURL!)]);
  await page.goto(`/dashboard/invitations/${id}/guests`);

  // Add the Sharma family, invited to Sangeet + Wedding only.
  await page.getByRole("button", { name: "Add guest", exact: true }).first().click();
  await page.getByLabel("Name on the invitation").fill("Sharma Family");
  await page.getByLabel("Greeting").fill("Dear Sharma ji and family,");
  await page.getByLabel("WhatsApp number").fill("+91 98765 43210");
  await page.getByLabel("Private notes").fill("SECRET-NOTE bride's side");
  await page.getByText("Selected events").click();
  await page.getByRole("checkbox", { name: new RegExp(sangeet.name) }).check();
  await page.getByRole("checkbox", { name: new RegExp(wedding.name) }).check();
  await page.getByRole("button", { name: "Add guest", exact: true }).last().click();
  await expect(page.getByText("Sharma Family added")).toBeVisible();

  // Bulk add two more.
  await page.getByRole("button", { name: "Bulk add" }).click();
  await page.getByLabel("Guest names, one per line").fill("Amit Verma OTHER-GUEST\nNeha & Karan");
  await page.getByRole("button", { name: "Add 2 guests" }).click();
  await expect(page.getByText("2 guests added")).toBeVisible();

  const sharma = await prisma.guest.findFirstOrThrow({
    where: { invitationId: id, displayName: "Sharma Family" },
  });
  expect(sharma.status).toBe("NOT_SHARED");

  // Copy link → Shared.
  await page.getByRole("button", { name: "Copy link for Sharma Family" }).click();
  await expect
    .poll(async () => (await prisma.guest.findUniqueOrThrow({ where: { id: sharma.id } })).status)
    .toBe("SHARED");
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied.endsWith(`/i/${slug}/guest/${sharma.token}`)).toBe(true); // origin comes from NEXT_PUBLIC_APP_URL

  // A link-preview crawler fetching the page does not mark it opened.
  const crawl = await request.get(`/i/${slug}/guest/${sharma.token}`, {
    headers: { "User-Agent": "WhatsApp/2.23.20.0" },
  });
  expect(crawl.status()).toBe(200);
  expect(crawl.headers()["cache-control"]).toContain("no-store");
  expect(crawl.headers()["referrer-policy"]).toBe("no-referrer");

  // #1–#3: the full guest response (HTML + RSC payload) leaks nothing.
  const html = await crawl.text();
  expect(html).toContain("Sharma Family");
  for (const hidden of [mehndi.venue.name, reception.venue.name])
    expect(html).not.toContain(hidden);
  for (const leak of [
    "OTHER-GUEST",
    "Neha &amp; Karan",
    "Neha & Karan",
    "SECRET-NOTE",
    "98765",
    owner.user.email,
  ])
    expect(html).not.toContain(leak);
  const others = await prisma.guest.findMany({
    where: { invitationId: id, NOT: { id: sharma.id } },
    select: { token: true },
  });
  for (const o of others) expect(html).not.toContain(o.token);
  expect((await prisma.guest.findUniqueOrThrow({ where: { id: sharma.id } })).status).toBe(
    "SHARED",
  );

  // Guest opens (separate browser, signed out) → Opened.
  const guestCtx = await browser.newContext();
  const guestPage = await guestCtx.newPage();
  await guestPage.goto(`${baseURL}/i/${slug}/guest/${sharma.token}`);
  await expect(guestPage.getByText("Sharma Family").first()).toBeVisible();
  await guestPage.getByRole("button", { name: /Open Invitation/i }).click();
  await expect
    .poll(async () => (await prisma.guest.findUniqueOrThrow({ where: { id: sharma.id } })).status, {
      timeout: 10_000,
    })
    .toBe("OPENED");
  await page.reload();
  await expect(page.getByRole("row", { name: /Sharma Family/ }).getByText("Opened")).toBeVisible();

  // #7: garbage beacons → 204 and no change.
  for (const body of [
    "not json",
    JSON.stringify({ slug, token: "x" }),
    JSON.stringify({ slug: "../etc", token: sharma.token }),
  ]) {
    const r = await request.post("/api/v1/beacon/open", {
      data: body,
      headers: { "Content-Type": "application/json" },
    });
    expect(r.status()).toBe(204);
  }
  expect((await prisma.guest.findUniqueOrThrow({ where: { id: sharma.id } })).openCount).toBe(1);

  // #5: regenerate → old link shows the same page as an unknown token.
  await page.getByRole("button", { name: "More actions for Sharma Family" }).click();
  await page.getByRole("menuitem", { name: "New link" }).click();
  await page.getByRole("button", { name: "Create new link" }).click();
  await expect(page.getByText(/old one no longer works/)).toBeVisible();
  const fresh = await prisma.guest.findUniqueOrThrow({ where: { id: sharma.id } });
  expect(fresh.token).not.toBe(sharma.token);
  const revoked = await request.get(`/i/${slug}/guest/${sharma.token}`);
  const unknown = await request.get(`/i/${slug}/guest/${"Z".repeat(22)}`);
  expect(revoked.status()).toBe(404);
  expect(unknown.status()).toBe(404);
  const visibleText = async (r: typeof revoked) =>
    (await r.text())
      .replace(/<script[\s\S]*?<\/script>/g, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ");
  expect(await visibleText(revoked)).toBe(await visibleText(unknown));
  expect((await request.get(`/i/${slug}/guest/${fresh.token}`)).status()).toBe(200);

  // #4: a valid token on another slug is invalid.
  const other = await createInvitationFor(owner.user.id);
  await publishFor(other.id);
  expect((await request.get(`/i/${other.slug}/guest/${fresh.token}`)).status()).toBe(404);

  // #6: unpublish (through the real UI, which purges the cache) → every guest link stops.
  await page.goto(`/dashboard/invitations/${id}/share`);
  await page.getByRole("button", { name: "Unpublish" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Unpublish" }).click();
  await expect(page.getByText("Before you publish")).toBeVisible({ timeout: 15_000 });
  await expect
    .poll(async () => (await request.get(`/i/${slug}/guest/${fresh.token}`)).status())
    .toBe(404);
  await guestCtx.close();
});

test("guest manager works at phone size", async ({ page, context, baseURL }, info) => {
  test.skip(info.project.name !== "mobile", "Mobile layout check.");
  const { id } = await createInvitationFor(owner.user.id);
  await context.addCookies([sessionCookie(owner.sessionToken, baseURL!)]);
  await page.goto(`/dashboard/invitations/${id}/guests`);
  await expect(page.getByText(/Personal links start working once/)).toBeVisible();
  await page.getByRole("button", { name: "Bulk add" }).click();
  await page.getByLabel("Guest names, one per line").fill("Amit Verma\nNeha & Karan");
  await page.getByRole("button", { name: "Add 2 guests" }).click();
  await expect(page.getByText("Neha & Karan")).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy link for Amit Verma" })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
