// @vitest-environment node
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";

describe("middleware auth gate", () => {
  it("redirects to /login with callbackUrl when no session cookie", () => {
    const res = middleware(
      new NextRequest("http://localhost:3000/dashboard/invitations?status=draft"),
    );
    expect(res.status).toBe(307);
    const location = new URL(res.headers.get("location")!);
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("callbackUrl")).toBe("/dashboard/invitations?status=draft");
  });

  it("lets requests with a session cookie through", () => {
    const req = new NextRequest("http://localhost:3000/dashboard", {
      headers: { cookie: "authjs.session-token=abc" },
    });
    const res = middleware(req);
    expect(res.headers.get("location")).toBeNull();
  });
});

describe("middleware CSP nonce", () => {
  const csp = (res: Response) => res.headers.get("content-security-policy") ?? "";

  it("adds a fresh nonce policy (no unsafe-inline) on dynamic pages", () => {
    const req = () =>
      new NextRequest("http://localhost:3000/i/priya-rahul/guest/abcdefghijklmnopqrstuv");
    const a = csp(middleware(req()));
    const b = csp(middleware(req()));
    expect(a).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+'(;| 'unsafe-eval')/);
    expect(a).not.toMatch(/script-src[^;]*'unsafe-inline'/);
    expect(a).not.toBe(b);
  });

  it("leaves static pages to next.config headers", () => {
    expect(csp(middleware(new NextRequest("http://localhost:3000/i/priya-rahul")))).toBe("");
  });
});
