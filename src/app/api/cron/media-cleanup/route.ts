import { NextResponse } from "next/server";
import { isAuthorizedCron } from "@/server/http/cron";
import { logEvent } from "@/server/log";
import { runMediaCleanup } from "@/server/services/maintenance";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** GET /api/cron/media-cleanup — daily 03:00 IST (vercel.json). */
export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) return new NextResponse("Unauthorized", { status: 401 });
  const result = await runMediaCleanup();
  logEvent("cron.media_cleanup", result);
  return NextResponse.json(result);
}
