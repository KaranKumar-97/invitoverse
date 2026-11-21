import { describe, expect, it } from "vitest";
import { buildCsp, usesNonce } from "@/lib/security/csp";

describe("CSP", () => {
  it("nonces exactly the dynamically rendered routes", () => {
    for (const p of [
      "/dashboard",
      "/dashboard/invitations/x/edit",
      "/preview/x",
      "/login",
      "/i/a/guest/tok",
    ])
      expect(usesNonce(p), p).toBe(true);
    for (const p of [
      "/",
      "/templates",
      "/templates/royal-heritage/preview",
      "/i/a",
      "/i/a/guest",
      "/api/og/a",
    ])
      expect(usesNonce(p), p).toBe(false);
  });

  it("locks down the dangerous directives", () => {
    const p = buildCsp({ nonce: "abc" });
    expect(p).toContain("object-src 'none'");
    expect(p).toContain("base-uri 'self'");
    expect(p).toContain("frame-ancestors 'self'");
    expect(p).toContain("frame-src 'self' https://www.youtube-nocookie.com");
    expect(p).not.toContain("unsafe-eval");
    expect(buildCsp({ dev: true })).toContain("'unsafe-eval'");
  });
});
