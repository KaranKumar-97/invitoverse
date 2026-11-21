import { NextResponse, type NextRequest } from "next/server";
import { buildCsp, cspHeaderName, usesNonce } from "@/lib/security/csp";

/**
 * 1. Cheap gate for private areas: redirect when there is no session cookie at all. This is NOT
 *    the security boundary — layouts, pages and actions verify the session against the database
 *    (docs/13-security.md §2). Middleware runs on the edge and must not import Prisma.
 * 2. Per-request CSP nonce for dynamically rendered pages (static pages get their CSP from
 *    next.config headers).
 */
const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"];
const PRIVATE = /^\/(dashboard|preview|admin)(\/|$)/;

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (PRIVATE.test(pathname) && !SESSION_COOKIES.some((name) => req.cookies.has(name))) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?callbackUrl=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  if (!usesNonce(pathname)) return NextResponse.next();

  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp({ nonce, dev: process.env.NODE_ENV !== "production" });
  const headers = new Headers(req.headers);
  headers.set("x-nonce", nonce);
  // Next.js reads the nonce from the request's CSP header and adds it to its own <script> tags.
  headers.set("Content-Security-Policy", csp);
  const res = NextResponse.next({ request: { headers } });
  res.headers.set(cspHeaderName(), csp);
  return res;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/preview/:path*",
    "/login/:path*",
    "/admin/:path*",
    "/admin",
    "/login",
    "/i/:slug/guest/:token",
  ],
};
