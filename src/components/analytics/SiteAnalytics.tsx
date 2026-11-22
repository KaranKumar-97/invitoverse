"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";
import { analyticsUrl } from "@/lib/analytics";

/**
 * Vercel Web Analytics (cookieless page views). Every URL passes through `analyticsUrl` first, so
 * guest tokens, internal ids and query strings never leave the browser (docs/13-security.md §9).
 * Rendered only on Vercel deployments (see the root layout).
 */
export function SiteAnalytics() {
  return (
    <Analytics
      beforeSend={(event: BeforeSendEvent) => {
        const url = analyticsUrl(event.url);
        return url ? { ...event, url } : null;
      }}
    />
  );
}
