/**
 * Marketing analytics events (docs/09 §7). Forwards to Vercel Analytics, which `SiteAnalytics`
 * loads on Vercel deployments; a no-op elsewhere. Never pass personal data or guest tokens.
 */
export type MarketingEvent =
  | "cta_choose_design"
  | "cta_live_invite"
  | "template_card_click"
  | "template_use_click"
  | "contact_submit";

type VaQueue = (event: "event", payload: { name: string; data?: Record<string, string> }) => void;

export function track(name: MarketingEvent, data?: Record<string, string>) {
  if (typeof window === "undefined") return;
  const va = (window as unknown as { va?: VaQueue }).va;
  try {
    va?.("event", { name, data });
  } catch {
    /* analytics must never break the page */
  }
}

/**
 * URL scrubbing for page-view analytics. Plain module (no "use client") so it can be unit tested
 * and shared. Returns the URL to report, or `null` to drop the event.
 *
 * - Guest links carry a secret token: `/i/{slug}/guest/{token}` → `/i/{slug}/guest/[token]`.
 * - Dashboard/editor ids are internal: `/dashboard/invitations/{id}/…` → `/dashboard/invitations/[id]/…`.
 * - `/preview/{id}` is the editor's draft iframe: dropped (it would double-count the editor).
 * - Query strings may hold emails or callback URLs: only `ref` and `utm_*` are kept. Hash dropped.
 */
const KEEP_PARAM = /^(ref|utm_[a-z]+)$/;

export function analyticsUrl(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  let path = url.pathname;
  if (/^\/preview(\/|$)/.test(path)) return null;
  path = path
    .replace(/^(\/i\/[^/]+\/guest\/)[^/]+/, "$1[token]")
    .replace(/^(\/dashboard\/invitations\/)(?!new(\/|$))[^/]+/, "$1[id]");

  const kept = new URLSearchParams();
  url.searchParams.forEach((value, key) => {
    if (KEEP_PARAM.test(key)) kept.append(key, value);
  });
  const query = kept.toString();
  return `${url.origin}${path}${query ? `?${query}` : ""}`;
}
