import { NextResponse } from "next/server";
import { isAuthorizedCron } from "@/server/http/cron";
import { logEvent } from "@/server/log";
import { purgeDeleted } from "@/server/services/maintenance";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** GET /api/cron/purge-deleted — daily 03:30 IST (vercel.json). */
export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) return new NextResponse("Unauthorized", { status: 401 });
  const result = await purgeDeleted();
  logEvent("cron.purge_deleted", result);
  return NextResponse.json(result);
}
