import { scrubDeep, scrubString } from "./scrub";

/**
 * Shared Sentry settings (docs/13-security.md §10, docs/14 §6). Errors only — no tracing or
 * replay — and every event is scrubbed of guest tokens, emails and phone numbers before sending.
 */
type AnyEvent = {
  request?: {
    url?: string;
    cookies?: unknown;
    headers?: Record<string, string>;
    query_string?: unknown;
  };
  user?: unknown;
  breadcrumbs?: unknown[];
  [k: string]: unknown;
};

export function scrubSentryEvent<E extends object>(event: E): E {
  const e = scrubDeep(event as unknown as AnyEvent);
  if (e.request) {
    delete e.request.cookies;
    delete e.request.query_string;
    if (e.request.url) e.request.url = scrubString(e.request.url);
  }
  // We never attach users; keep only an opaque id if a future integration adds one.
  if (e.user && typeof e.user === "object") e.user = { id: (e.user as { id?: string }).id };
  return e as unknown as E;
}

export const sentryBaseOptions = {
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
  sendDefaultPii: false,
  tracesSampleRate: 0,
  maxBreadcrumbs: 30,
  ignoreErrors: [
    // Browser extensions / flaky webviews; not actionable.
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications",
    "AbortError",
  ],
};
