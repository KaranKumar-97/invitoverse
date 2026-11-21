/**
 * Uniform result type for Server Actions (docs/04-api-design.md §1).
 */
export type ErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "CONFLICT"
  | "LIMIT_EXCEEDED"
  | "RATE_LIMITED"
  | "ENTITLEMENT_REQUIRED"
  | "INTERNAL";

export type ActionError = {
  code: ErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: ActionError };

const DEFAULT_MESSAGES: Record<ErrorCode, string> = {
  UNAUTHENTICATED: "Please sign in to continue.",
  FORBIDDEN: "You don't have access to this.",
  NOT_FOUND: "We couldn't find that.",
  VALIDATION: "Please check the highlighted fields.",
  CONFLICT: "This was changed somewhere else. Please reload.",
  LIMIT_EXCEEDED: "You've reached the limit for this.",
  RATE_LIMITED: "Too many attempts. Please wait a moment.",
  ENTITLEMENT_REQUIRED: "This needs an upgrade.",
  INTERNAL: "Something went wrong. Please try again.",
};

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function err<T = never>(
  code: ErrorCode,
  message?: string,
  fieldErrors?: Record<string, string[]>,
): ActionResult<T> {
  return { ok: false, error: { code, message: message ?? DEFAULT_MESSAGES[code], fieldErrors } };
}

/** Thrown by services/helpers; converted to an ActionResult by `toActionError`. */
export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message?: string,
    public readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message ?? DEFAULT_MESSAGES[code]);
    this.name = "AppError";
  }
}

export function toActionError<T = never>(e: unknown): ActionResult<T> {
  if (e instanceof AppError) return err(e.code, e.message, e.fieldErrors);
  console.error(e);
  return err("INTERNAL");
}

/** Only allow same-origin relative paths as post-login redirects (prevents open redirects). */
export function safeCallbackUrl(value: unknown, fallback = "/dashboard"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}
