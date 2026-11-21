import "server-only";

/**
 * Structured security/audit log lines (docs/13-security.md §10). One JSON object per line so
 * Vercel log drains can filter by `event`. Never log guest tokens, emails or phone numbers.
 */
export type AuditEvent =
  | "auth.sign_in"
  | "auth.magic_link_requested"
  | "auth.magic_link_rate_limited"
  | "invitation.published"
  | "invitation.unpublished"
  | "invitation.deleted"
  | "invitation.disabled"
  | "guest.token_regenerated"
  | "guest.deleted"
  | "cron.media_cleanup"
  | "cron.purge_deleted"
  | "csp.violation";

export function logEvent(event: AuditEvent, fields: Record<string, unknown> = {}) {
  if (process.env.NODE_ENV === "test" || process.env.VITEST) return;
  console.info(JSON.stringify({ level: "info", event, ts: new Date().toISOString(), ...fields }));
}
