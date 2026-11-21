import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";
import { buildCsp, cspHeaderName } from "./src/lib/security/csp";

const isProd = process.env.NODE_ENV === "production";
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Security headers (docs/13-security.md §6). Dynamic routes get a nonce-based CSP from middleware.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  ...(isProd
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
];

const nextConfig: NextConfig = {
  // Lets a production build run alongside `next dev` (e.g. NEXT_DIST_DIR=.next-build).
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  poweredByHeader: false,
  experimental: {
    // Tree-shake barrel exports so guest pages only ship the motion APIs they use.
    optimizePackageImports: ["motion", "lucide-react", "radix-ui"],
    serverActions: {
      bodySizeLimit: "1mb",
      allowedOrigins: [new URL(appUrl).host],
    },
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Static CSP for everything middleware doesn't nonce (keep in sync with NONCE_ROUTE_PATTERNS).
      {
        source: "/((?!dashboard|preview|login|admin|i/[^/]+/guest/).*)",
        headers: [{ key: cspHeaderName(), value: buildCsp({ dev: !isProd }) }],
      },
      // Invitation pages: never leak guest tokens through the Referer header.
      {
        source: "/i/:path*",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        source: "/dashboard/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
      {
        source: "/admin/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        source: "/preview/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

// Sentry: source maps upload only when SENTRY_AUTH_TOKEN is set (CI/Vercel). Browser events are
// tunnelled through our own origin (tunnel: true + serveTunnelIntegration) so CSP and ad blockers
// don't drop them.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  telemetry: false,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN, deleteSourcemapsAfterUpload: true },
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
    excludeTracing: true,
    excludeReplayIframe: true,
    excludeReplayShadowDom: true,
    excludeReplayWorker: true,
  },
});
