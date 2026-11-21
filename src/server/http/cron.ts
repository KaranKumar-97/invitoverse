import "server-only";
import { timingSafeEqual } from "node:crypto";

/** Vercel Cron calls carry `Authorization: Bearer ${CRON_SECRET}` (docs/14 §5). */
export function isAuthorizedCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
