import { randomBytes } from "node:crypto";
import { expect, test } from "@playwright/test";
import { cleanup, createUserWithSession, sessionCookie } from "./fixtures";

test.describe("marketing site", () => {
  test("home renders every section with no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      /Invitations that open like a love letter/,
    );
    for (const id of ["designs", "how-it-works", "faq", "about", "contact"])
      await expect(page.locator(`#${id}`)).toBeAttached();
    // FAQ accordion works without JavaScript state.
    const q = page.getByText("Do guests need to install an app?");
    await q.click();
    await expect(page.getByText(/opens instantly in any phone browser/)).toBeVisible();
    const width = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(width).toBe(0);
    expect(errors).toEqual([]);
  });

  test("catalogue filters by category and keeps it in the URL", async ({ page }) => {
    await page.goto("/templates");
    await expect(page.getByRole("link", { name: /Royal Heritage/ })).toBeVisible();
    await page.getByRole("button", { name: /^Minimal/ }).click();
    await expect(page).toHaveURL(/category=minimal/);
    await expect(page.getByRole("link", { name: /Minimal Luxury/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Royal Heritage/ })).toHaveCount(0);

    await page.reload();
    await expect(page.getByRole("button", { name: /^Minimal/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.getByRole("link", { name: /Royal Heritage/ })).toHaveCount(0);
  });

  test("template detail has metadata, structured data and a working preview", async ({
    page,
  }, info) => {
    await page.goto("/templates/royal-heritage");
    await expect(page.getByRole("heading", { level: 1, name: "Royal Heritage" })).toBeVisible();
    await expect(page).toHaveTitle(/Royal Heritage — Animated Wedding Invitation/);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      /\/templates\/royal-heritage\/og\.jpg$/,
    );
    const ld = await page.locator('script[type="application/ld+json"]').textContent();
    expect(JSON.parse(ld ?? "{}")["@type"]).toBe("Product");

    if (info.project.name === "desktop") {
      const frame = page.frameLocator('iframe[title="Royal Heritage live preview"]');
      await expect(frame.getByRole("button", { name: "Open invitation" })).toBeVisible();
      await page.getByRole("button", { name: "Preview palette: Emerald & Gold" }).click();
      await expect(page.locator("iframe")).toHaveAttribute("src", /palette=emerald-gold/);
    } else {
      await expect(page.locator("iframe")).toHaveCount(0);
    }
  });

  test("“Use this design” signed out → sign in → wizard with the design preselected", async ({
    page,
    context,
    baseURL,
  }) => {
    await page.goto("/templates/minimal-luxury");
    await page.getByRole("link", { name: "Use this design" }).click();
    await expect(page).toHaveURL(/\/login\?callbackUrl=/);
    const callback = new URL(page.url()).searchParams.get("callbackUrl");
    expect(callback).toBe("/dashboard/invitations/new?template=minimal-luxury");

    // Simulate completing sign-in (magic link delivery is covered elsewhere).
    const { user, sessionToken } = await createUserWithSession("marketing");
    try {
      await context.addCookies([sessionCookie(sessionToken, baseURL!)]);
      await page.goto(callback!);
      await expect(page.getByText(/Designing with Minimal Luxury\./)).toBeVisible();
    } finally {
      await cleanup([user.id]);
    }
  });

  test("contact form validates, then sends", async ({ page }) => {
    // A unique client IP per run keeps the 5/hour limit from tripping on reruns.
    await page.setExtraHTTPHeaders({
      "x-forwarded-for": `10.${[1, 2, 3].map(() => randomBytes(1)[0]).join(".")}`,
    });
    await page.goto("/contact");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText("Please tell us your name")).toBeVisible();

    await page.getByLabel("Your name").fill("E2E Tester");
    await page.getByLabel("Email or phone").fill("e2e@test.local");
    await page.getByLabel("How can we help?").fill("Testing the contact form end to end.");
    await page.waitForTimeout(2600); // time-to-submit check
    await page.getByRole("button", { name: "Send message" }).click();
    if (process.env.E2E_PROD === "1" && !process.env.CONTACT_INBOX) {
      // Production without email configured must fail gracefully, never pretend it sent.
      await expect(page.getByText(/Please email or WhatsApp us/)).toBeVisible();
    } else {
      await expect(page.getByText("Thank you — message received.")).toBeVisible();
    }
  });

  test("SEO endpoints", async ({ request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("/templates/royal-heritage");
    expect(sitemap).not.toContain("/i/");
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toMatch(/Disallow: \/i\//);
    expect(robots).toMatch(/Sitemap: .*\/sitemap\.xml/);
    const og = await request.get("/og");
    expect(og.headers()["content-type"]).toContain("image/png");
  });
});

test.describe("theme", () => {
  test.use({ colorScheme: "light" });

  test("toggle switches, persists, and never themes invitations", async ({ page }) => {
    const theme = () => page.evaluate(() => document.documentElement.dataset.theme);
    await page.goto("/");
    expect(await theme()).toBe("light");
    // Phones keep the switch in the menu; wider screens show it in the header.
    if (!(await page.getByRole("button", { name: "Switch to dark theme" }).first().isVisible()))
      await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("button", { name: "Switch to dark theme" }).first().click();
    expect(await theme()).toBe("dark");

    await page.reload();
    expect(await theme()).toBe("dark"); // remembered, applied before paint by theme-init.js
    await expect(page.locator('button[aria-label="Switch to light theme"]').first()).toBeAttached();

    // Invitation demo: always light (full load and client-side navigation).
    await page.goto("/templates/royal-heritage/preview");
    expect(await theme()).toBe("light");
    await page.goto("/templates");
    expect(await theme()).toBe("dark");
    await page
      .getByRole("link", { name: /Royal Heritage/ })
      .first()
      .click();
    await page.getByRole("link", { name: "Open live demo", exact: true }).click();
    await page.waitForURL(/\/preview/);
    await expect.poll(theme).toBe("light");
  });
});
