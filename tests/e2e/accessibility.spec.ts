import { expect, test } from "@playwright/test";
import { auditA11y, formatIssues } from "./a11y";
import {
  cleanup,
  createInvitationFor,
  createUserWithSession,
  prisma,
  publishFor,
  sessionCookie,
} from "./fixtures";
import { templateManifests } from "@/templates/registry";

let owner: Awaited<ReturnType<typeof createUserWithSession>>;
test.beforeAll(async () => {
  owner = await createUserWithSession("a11y");
});
test.afterAll(async () => {
  await cleanup([owner.user.id]);
  await prisma.$disconnect();
});

test.use({ reducedMotion: "reduce" });

for (const scheme of ["light", "dark"] as const) {
  test.describe(`${scheme} theme`, () => {
    // theme-init.js follows the device setting when the visitor hasn't chosen.
    test.use({ colorScheme: scheme });

    for (const path of [
      "/",
      "/templates",
      "/templates/royal-heritage",
      "/contact",
      "/about",
      "/privacy",
      "/login",
    ]) {
      test(`studio page ${path} passes the a11y audit`, async ({ page }) => {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe(scheme);
        expect(formatIssues(await auditA11y(page))).toEqual([]);
      });
    }

    test("dashboard pages pass the a11y audit", async ({ page, context, baseURL }) => {
      test.setTimeout(90_000);
      const { id } = await createInvitationFor(owner.user.id);
      await publishFor(id);
      await context.addCookies([sessionCookie(owner.sessionToken, baseURL!)]);
      for (const path of [
        "/dashboard",
        "/dashboard/invitations",
        "/dashboard/invitations/new",
        `/dashboard/invitations/${id}/share`,
        `/dashboard/invitations/${id}/guests`,
        `/dashboard/invitations/${id}/edit`,
      ]) {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        if (path.endsWith("/edit")) await page.locator("[data-ready]").waitFor();
        expect(formatIssues(await auditA11y(page)), path).toEqual([]);
      }
    });
  });
}

for (const [slug, manifest] of Object.entries(templateManifests)) {
  for (const palette of manifest.palettes) {
    test(`template ${slug} · ${palette.name} passes the a11y audit`, async ({ page }) => {
      await page.goto(`/templates/${slug}/preview?embed=1&palette=${palette.id}`);
      await page
        .getByRole("button", { name: /Open invitation/i })
        .first()
        .click();
      await expect(page.locator('[data-phase="open"]')).toBeAttached({ timeout: 15_000 });
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 500) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 40));
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(1500);
      // Every scroll reveal must have played (nothing left invisible after scrolling through).
      const hidden = await page.evaluate(
        () =>
          [...document.querySelectorAll<HTMLElement>("[data-phase] [style*='opacity']")].filter(
            (el) => getComputedStyle(el).opacity === "0" && !el.closest("[aria-hidden='true']"),
          ).length,
      );
      expect(hidden).toBe(0);
      expect(formatIssues(await auditA11y(page))).toEqual([]);
    });
  }
}
