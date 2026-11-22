import { describe, expect, it } from "vitest";
import { analyticsUrl } from "@/lib/analytics";

const O = "https://example.com";

describe("analyticsUrl", () => {
  it("replaces guest tokens", () => {
    expect(analyticsUrl(`${O}/i/aarav-meera/guest/Zq3k9X_abcDEF123456789`)).toBe(
      `${O}/i/aarav-meera/guest/[token]`,
    );
  });

  it("keeps public invitation and marketing paths", () => {
    expect(analyticsUrl(`${O}/i/aarav-meera`)).toBe(`${O}/i/aarav-meera`);
    expect(analyticsUrl(`${O}/templates/mandir`)).toBe(`${O}/templates/mandir`);
    expect(analyticsUrl(`${O}/`)).toBe(`${O}/`);
  });

  it("replaces internal invitation ids but not /new", () => {
    expect(analyticsUrl(`${O}/dashboard/invitations/clx123abc/edit`)).toBe(
      `${O}/dashboard/invitations/[id]/edit`,
    );
    expect(analyticsUrl(`${O}/dashboard/invitations/new`)).toBe(`${O}/dashboard/invitations/new`);
  });

  it("drops the editor's draft preview iframe", () => {
    expect(analyticsUrl(`${O}/preview/clx123abc`)).toBeNull();
  });

  it("keeps only ref and utm_* params and drops the hash", () => {
    expect(
      analyticsUrl(`${O}/login/check-email?email=a%40b.com&ref=invite&utm_source=wa#top`),
    ).toBe(`${O}/login/check-email?ref=invite&utm_source=wa`);
  });

  it("drops unparseable urls", () => {
    expect(analyticsUrl("not a url")).toBeNull();
  });
});
