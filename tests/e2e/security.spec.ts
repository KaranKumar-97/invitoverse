import { randomBytes } from "node:crypto";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import {
  cleanup,
  createInvitationFor,
  createUserWithSession,
  prisma,
  publishFor,
  sessionCookie,
} from "./fixtures";

/** Collects CSP violations from every frame (docs/13 §11: "CSP has no violations on all templates"). */
async function watchCsp(context: BrowserContext) {
  await context.addInitScript(() => {
    const w = window as unknown as { __csp: string[] };
    w.__csp = [];
    document.addEventListener("securitypolicyviolation", (e) =>
      w.__csp.push(`${e.effectiveDirective} ${e.blockedURI} @ ${location.pathname}`),
    );
  });
  const reports: string[] = [];
  await context.route("**/api/csp-report", async (route) => {
    reports.push(route.request().postData() ?? "");
    await route.fulfill({ status: 204 });
  });
  return reports;
}

async function violations(page: Page) {
  const all: string[] = [];
  for (const frame of page.frames())
    all.push(
      ...((await frame
        .evaluate(() => (window as unknown as { __csp?: string[] }).__csp ?? [])
        .catch(() => [])) as string[]),
    );
  return all;
}

let owner: Awaited<ReturnType<typeof createUserWithSession>>;
test.beforeAll(async () => {
  owner = await createUserWithSession("security");
});
test.afterAll(async () => {
  await cleanup([owner.user.id]);
  await prisma.$disconnect();
});

test("no CSP violations across public, guest and owner pages", async ({
  page,
  context,
  baseURL,
}, info) => {
  test.setTimeout(150_000);
  const reports = await watchCsp(context);
  const { id, slug } = await createInvitationFor(owner.user.id);
  await publishFor(id);
  const guest = await prisma.guest.create({
    data: {
      invitationId: id,
      displayName: "CSP Family",
      token: randomBytes(16).toString("base64url"),
    },
  });

  const open = async () => {
    const btn = page.getByRole("button", { name: /Open invitation/i }).first();
    await btn.click();
    await expect(page.locator('[data-phase="open"]')).toBeAttached({ timeout: 15_000 });
    await page.mouse.wheel(0, 4000);
    await page.waitForTimeout(800);
  };

  const pages: Array<[string, (() => Promise<void>)?]> = [
    ["/"],
    ["/templates"],
    ["/templates/royal-heritage"],
    ["/templates/royal-heritage/preview", open],
    ["/templates/minimal-luxury/preview?guest=1", open],
    ["/templates/deepam/preview?palette=temple-stone", open],
    ["/templates/meenakshi/preview?guest=1", open],
    [`/i/${slug}`, open],
    [`/i/${slug}/guest/${guest.token}`, open],
    ["/login"],
    ["/contact"],
  ];
  for (const [path, act] of pages) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    if (act) await act();
    expect(await violations(page), path).toEqual([]);
  }

  expect(reports, `${info.project.name} CSP reports`).toEqual([]);
  await context.addCookies([sessionCookie(owner.sessionToken, baseURL!)]);
  for (const path of [
    "/dashboard",
    "/dashboard/invitations",
    `/dashboard/invitations/${id}/guests`,
    `/dashboard/invitations/${id}/share`,
  ]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    expect(await violations(page), path).toEqual([]);
  }
  // The editor's live preview iframe is only on screen at desktop widths.
  if (info.project.name === "mobile") return;
  await page.goto(`/dashboard/invitations/${id}/edit`);
  await page.locator("[data-ready]").waitFor();
  await page.frameLocator("iframe").first().locator("[data-phase]").waitFor();
  expect(await violations(page), "editor").toEqual([]);
});

test("drafts are not reachable through any public route", async ({ request }) => {
  const { slug, id } = await createInvitationFor(owner.user.id);
  const draft = (await prisma.invitation.findUniqueOrThrow({ where: { id } })).draftContent as {
    events: Array<{ id: string }>;
  };
  const guest = await prisma.guest.create({
    data: {
      invitationId: id,
      displayName: "Draft Guest",
      token: randomBytes(16).toString("base64url"),
    },
  });
  for (const path of [
    `/i/${slug}`,
    `/i/${slug}/guest/${guest.token}`,
    `/api/og/${slug}`,
    `/api/v1/ics/${slug}/${draft.events[0]!.id}`,
  ])
    expect((await request.get(path)).status(), path).toBe(404);
});

test("user text renders inert (no script execution, no HTML injection)", async ({ page }) => {
  const { id, slug } = await createInvitationFor(owner.user.id);
  const row = await prisma.invitation.findUniqueOrThrow({ where: { id } });
  const content = row.draftContent as {
    couple: { bride: { firstName: string } };
    messages: { welcome?: string; closing?: string };
    hashtag?: string;
  };
  const payload = `<img src=x onerror="window.__xss=1"><script>window.__xss=1</script>`;
  content.couple.bride.firstName = `Asha<b>`;
  content.messages.welcome = payload;
  content.messages.closing = `"><svg onload=window.__xss=1>`;
  await prisma.invitation.update({ where: { id }, data: { draftContent: content as object } });
  await publishFor(id);

  let dialogs = 0;
  page.on("dialog", (d) => {
    dialogs++;
    void d.dismiss();
  });
  await page.goto(`/i/${slug}`);
  await page
    .getByRole("button", { name: /Open invitation/i })
    .first()
    .click();
  await expect(page.locator('[data-phase="open"]')).toBeAttached({ timeout: 15_000 });
  await page.mouse.wheel(0, 6000);
  await page.waitForTimeout(800);
  expect(
    await page.evaluate(() => (window as unknown as { __xss?: number }).__xss),
  ).toBeUndefined();
  expect(dialogs).toBe(0);
  await expect(page.getByText(payload).first()).toBeAttached();
  expect(await page.locator("img[src='x'], svg[onload]").count()).toBe(0);
});

test("security headers", async ({ request }) => {
  const home = await request.get("/");
  const h = home.headers();
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["x-frame-options"]).toBe("SAMEORIGIN");
  expect(h["content-security-policy"]).toContain("object-src 'none'");
  expect(h["permissions-policy"]).toContain("camera=()");
  expect(h["x-powered-by"]).toBeUndefined();

  const login = await request.get("/login");
  expect(login.headers()["content-security-policy"]).toMatch(/script-src 'self' 'nonce-[^']+'/);
  const html = await login.text();
  const nonce = /'nonce-([^']+)'/.exec(login.headers()["content-security-policy"]!)![1];
  expect(html).toContain(`nonce="${nonce}"`);

  const health = await request.get("/api/health");
  expect(await health.json()).toEqual({ status: "ok", db: "ok" });
  expect((await request.get("/api/cron/media-cleanup")).status()).toBe(401);
});

test("/admin is invisible to everyone but admins", async ({ page, context, baseURL, request }) => {
  expect((await request.get("/admin", { maxRedirects: 0 })).status()).toBe(307); // no session → login
  await context.addCookies([sessionCookie(owner.sessionToken, baseURL!)]);
  const res = await page.goto("/admin");
  expect(res?.status()).toBe(404);

  const admin = await createUserWithSession("admin");
  try {
    await prisma.user.update({ where: { id: admin.user.id }, data: { role: "ADMIN" } });
    await context.clearCookies();
    await context.addCookies([sessionCookie(admin.sessionToken, baseURL!)]);
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Platform overview" })).toBeVisible();
    await expect(page.getByText("Accounts")).toBeVisible();
    // Counts only: other users' data never appears. (Dev mode also embeds the viewer's own
    // session in React debug info, so check for someone else's email.)
    expect(await page.content()).not.toContain(owner.user.email);
  } finally {
    await cleanup([admin.user.id]);
  }
});
