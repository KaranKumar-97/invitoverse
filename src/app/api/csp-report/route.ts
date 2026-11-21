import { scrubString } from "@/lib/observability/scrub";
import { logEvent } from "@/server/log";
import { clientIp, rateLimit } from "@/server/integrations/ratelimit";

const NO_CONTENT = () => new Response(null, { status: 204 });

/** POST /api/csp-report — browsers report CSP violations here (report-uri). Logged, scrubbed. */
export async function POST(req: Request) {
  if (!(await rateLimit(`csp:${clientIp(req)}`, 30, 60_000)).ok) return NO_CONTENT();
  try {
    const text = (await req.text()).slice(0, 8_000);
    const body = JSON.parse(text) as { "csp-report"?: Record<string, unknown> };
    const r = body["csp-report"] ?? {};
    const pick = (k: string) =>
      typeof r[k] === "string" ? scrubString(r[k] as string).slice(0, 300) : undefined;
    logEvent("csp.violation", {
      directive: pick("effective-directive") ?? pick("violated-directive"),
      blocked: pick("blocked-uri"),
      page: pick("document-uri"),
      source: pick("source-file"),
      line: r["line-number"],
    });
  } catch {
    /* malformed report */
  }
  return NO_CONTENT();
}
