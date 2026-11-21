/**
 * Marketing analytics events (docs/09 §7). Forwards to Vercel Analytics when it is loaded
 * (Phase 7); a no-op until then. Never pass personal data or guest tokens.
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
