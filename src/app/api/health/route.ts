import { NextResponse } from "next/server";
import { checkDatabase } from "@/server/services/maintenance";

export const dynamic = "force-dynamic";

/** GET /api/health — liveness + DB ping for uptime monitors (docs/04 §2). Reveals nothing else. */
export async function GET() {
  const db = await checkDatabase();
  return NextResponse.json(
    { status: db ? "ok" : "degraded", db: db ? "ok" : "down" },
    { status: db ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
