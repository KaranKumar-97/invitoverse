import "server-only";
import { prisma } from "@/server/db/prisma";

/**
 * Payment-ready seam (docs/17-future-payments.md §2). Every template gate calls this, so
 * payments can be switched on without touching the editor.
 */
const launchAllFree = () => process.env.LAUNCH_ALL_FREE !== "false";

export async function canUseTemplate(userId: string, templateSlug: string): Promise<boolean> {
  const t = await prisma.template.findUnique({
    where: { slug: templateSlug },
    select: { isActive: true, tier: true },
  });
  if (!t?.isActive) return false;
  if (t.tier === "FREE" || launchAllFree()) return true;
  const ent = await prisma.entitlement.findFirst({
    where: {
      userId,
      type: "TEMPLATE",
      templateSlug,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: { id: true },
  });
  return Boolean(ent);
}
