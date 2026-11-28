import "server-only";
import { notFound } from "next/navigation";
import type { PermissionKey } from "@/lib/admin/permissions";
import { getAdminAccess, type AdminAccess } from "@/server/services/admin-access";
import { getOptionalUser, type SessionUser } from "./session";

/**
 * For admin pages and layouts: the signed-in admin and their access, or a 404 (admin pages are
 * invisible to everyone else). Pass a permission key, or "superadmin", to guard a specific page.
 */
export async function requireAdminPage(
  need?: PermissionKey | "superadmin",
): Promise<{ user: SessionUser; access: AdminAccess }> {
  const user = await getOptionalUser();
  if (!user) notFound();
  const access = await getAdminAccess(user.id);
  if (!access) notFound();
  if (need === "superadmin" && access.role !== "SUPERADMIN") notFound();
  if (need && need !== "superadmin" && !access.permissions.has(need)) notFound();
  return { user, access };
}
