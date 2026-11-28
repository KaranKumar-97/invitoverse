import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth/config";
import { AppError } from "@/lib/action-result";

export type SessionUser = {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  role: "USER" | "ADMIN" | "SUPERADMIN";
};

/** Returns the signed-in user, or null. */
export async function getOptionalUser(): Promise<SessionUser | null> {
  const session = await auth();
  const u = session?.user;
  if (!u?.id) return null;
  return {
    id: u.id,
    email: u.email ?? null,
    name: u.name ?? null,
    image: u.image ?? null,
    role: u.role,
  };
}

/** For Server Actions and route handlers: throws AppError("UNAUTHENTICATED"). */
export async function requireUser(): Promise<SessionUser> {
  const user = await getOptionalUser();
  if (!user) throw new AppError("UNAUTHENTICATED");
  return user;
}

/** For pages and layouts: redirects to /login, preserving where the user was going. */
export async function requireUserOrRedirect(callbackUrl = "/dashboard"): Promise<SessionUser> {
  const user = await getOptionalUser();
  if (!user) redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  return user;
}

/** Any admin (Admin or Superadmin). Everyone else gets NOT_FOUND so admin pages stay invisible. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN" && user.role !== "SUPERADMIN") throw new AppError("NOT_FOUND");
  return user;
}
