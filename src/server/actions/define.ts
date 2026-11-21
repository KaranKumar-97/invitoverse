import "server-only";
import type { z } from "zod";
import { err, ok, toActionError, type ActionResult } from "@/lib/action-result";
import { requireUser } from "@/server/auth/session";
import type { Ctx } from "@/server/services/context";

/**
 * Body of every Server Action: authenticate → validate input with Zod → call the service with
 * the user's ctx → typed ActionResult. Errors never leak internals.
 *
 * Next.js requires each export of a "use server" file to be an `async function`, so actions are
 * written as `export async function x(input) { return runAction(Schema, input, handler); }`.
 */
export async function runAction<S extends z.ZodType, O>(
  schema: S,
  raw: unknown,
  handler: (ctx: Ctx, input: z.infer<S>) => Promise<O>,
): Promise<ActionResult<O>> {
  try {
    const user = await requireUser();
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues)
        (fieldErrors[issue.path.map(String).join(".") || "_"] ??= []).push(issue.message);
      return err("VALIDATION", undefined, fieldErrors);
    }
    return ok(await handler({ userId: user.id }, parsed.data));
  } catch (e) {
    return toActionError(e);
  }
}
