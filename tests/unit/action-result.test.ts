import { describe, expect, it } from "vitest";
import { AppError, err, ok, safeCallbackUrl, toActionError } from "@/lib/action-result";

describe("ActionResult helpers", () => {
  it("wraps data in ok()", () => {
    expect(ok({ id: "x" })).toEqual({ ok: true, data: { id: "x" } });
  });

  it("uses default messages in err()", () => {
    const r = err("NOT_FOUND");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/couldn't find/);
  });

  it("converts AppError and hides unknown errors", () => {
    const known = toActionError(new AppError("CONFLICT"));
    expect(!known.ok && known.error.code).toBe("CONFLICT");
    const original = console.error;
    console.error = () => {};
    const unknown = toActionError(new Error("db exploded: secret details"));
    console.error = original;
    expect(!unknown.ok && unknown.error.code).toBe("INTERNAL");
    expect(!unknown.ok && unknown.error.message).not.toContain("secret");
  });
});

describe("safeCallbackUrl", () => {
  it.each([
    ["/dashboard/invitations", "/dashboard/invitations"],
    [
      "/dashboard/invitations/new?template=royal-heritage",
      "/dashboard/invitations/new?template=royal-heritage",
    ],
  ])("allows relative path %s", (input, expected) => {
    expect(safeCallbackUrl(input)).toBe(expected);
  });

  it.each([
    "https://evil.example.com",
    "//evil.example.com",
    "/\\evil.example.com",
    "javascript:alert(1)",
    "",
    undefined,
    42,
  ])("rejects %s", (input) => {
    expect(safeCallbackUrl(input)).toBe("/dashboard");
  });
});
