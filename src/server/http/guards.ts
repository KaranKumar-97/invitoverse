import "server-only";
import { NextResponse } from "next/server";
import { AppError, type ErrorCode } from "@/lib/action-result";

const STATUS: Record<ErrorCode, number> = {
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION: 400,
  CONFLICT: 409,
  LIMIT_EXCEEDED: 413,
  RATE_LIMITED: 429,
  ENTITLEMENT_REQUIRED: 402,
  INTERNAL: 500,
};

/** Mutating route handlers must be called from our own pages (CSRF defence; docs/13-security.md §7). */
export function assertSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) throw new AppError("FORBIDDEN");
}

export function errorResponse(e: unknown) {
  if (e instanceof AppError) {
    return NextResponse.json(
      { error: { code: e.code, message: e.message, fieldErrors: e.fieldErrors } },
      { status: STATUS[e.code] },
    );
  }
  console.error(e);
  return NextResponse.json(
    { error: { code: "INTERNAL", message: "Something went wrong." } },
    { status: 500 },
  );
}
