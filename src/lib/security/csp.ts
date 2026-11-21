/**
 * Content-Security-Policy (docs/13-security.md §6). Plain module: used by next.config (static
 * pages) and middleware (dynamic pages, with a per-request nonce).
 *
 * - Dynamic routes (dashboard, editor, preview, login, guest pages) get `'self' 'nonce-…'`: inline
 *   scripts run only with the request nonce; same-origin chunks load normally. No 'strict-dynamic':
 *   it disables 'self', and Next emits un-nonced `<link rel=preload as=script>` for next/dynamic
 *   chunks, which strict-dynamic blocks. We load no third-party scripts, so it adds nothing.
 * - Statically rendered routes (marketing, public invitations — SSG/ISR) can't carry a per-request
 *   nonce, so they allow `'self' 'unsafe-inline'` for Next's inline bootstrap. They render no user
 *   HTML (React escapes text; no dangerouslySetInnerHTML with user data), so the risk is low.
 */
export const NONCE_ROUTE_PATTERNS = [
  /^\/dashboard(\/|$)/,
  /^\/preview(\/|$)/,
  /^\/login(\/|$)/,
  /^\/admin(\/|$)/,
  /^\/i\/[^/]+\/guest\/[^/]+\/?$/,
];

export function usesNonce(pathname: string) {
  return NONCE_ROUTE_PATTERNS.some((re) => re.test(pathname));
}

type Options = { nonce?: string; dev?: boolean };

export function buildCsp({ nonce, dev = false }: Options = {}): string {
  const script = nonce ? ["'self'", `'nonce-${nonce}'`] : ["'self'", "'unsafe-inline'"];
  if (dev) script.push("'unsafe-eval'"); // React Fast Refresh

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": script,
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": [
      "'self'",
      "data:",
      "blob:",
      "https://res.cloudinary.com",
      "https://lh3.googleusercontent.com",
    ],
    "media-src": ["'self'", "blob:", "https://res.cloudinary.com"],
    "font-src": ["'self'", "data:"],
    "frame-src": ["'self'", "https://www.youtube-nocookie.com"],
    // Sentry goes through our own /monitoring tunnel, so 'self' covers it.
    "connect-src": ["'self'", "https://api.cloudinary.com", ...(dev ? ["ws:"] : [])],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    // Chrome applies form-action to redirects after a form post (Google sign-in).
    "form-action": ["'self'", "https://accounts.google.com"],
    "frame-ancestors": ["'self'"],
    "report-uri": ["/api/csp-report"],
  };
  const policy = Object.entries(directives).map(([k, v]) => `${k} ${v.join(" ")}`);
  // Only on a real HTTPS origin: on http://localhost it would upgrade our own requests and break them.
  const https = (process.env.NEXT_PUBLIC_APP_URL ?? "").startsWith("https://");
  if (!dev && https) policy.push("upgrade-insecure-requests");
  return policy.join("; ");
}

/** `CSP_REPORT_ONLY=1` ships the policy as report-only (rollout step in docs/14 §8). */
export function cspHeaderName() {
  return process.env.CSP_REPORT_ONLY === "1"
    ? "Content-Security-Policy-Report-Only"
    : "Content-Security-Policy";
}
