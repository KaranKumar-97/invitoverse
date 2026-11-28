import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { AdminMobileNav } from "@/components/admin/AdminMobileNav";
import { AdminNav } from "@/components/admin/AdminNav";
import { ADMIN_NAV } from "@/components/admin/nav";
import { UserMenu } from "@/components/dashboard/UserMenu";
import { StudioProviders } from "@/components/StudioProviders";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { requireAdminPage } from "@/server/auth/admin";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

/** Admin area shell (docs/19-admin-panel.md §3). Non-admins get a 404 from requireAdminPage. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, access } = await requireAdminPage();
  const visible = ADMIN_NAV.filter(
    (n) =>
      n.need === null ||
      (n.need === "superadmin" ? access.role === "SUPERADMIN" : access.permissions.has(n.need)),
  ).map((n) => n.href);
  const roleLabel = access.role === "SUPERADMIN" ? "Superadmin" : "Admin";

  return (
    <StudioProviders>
      <div className="min-h-dvh lg:grid lg:grid-cols-[240px_1fr]">
        <aside className="sticky top-0 hidden h-dvh flex-col gap-8 border-r border-line px-4 py-6 lg:flex">
          <div className="flex items-center gap-2 px-3">
            <Logo href="/admin" />
          </div>
          <AdminNav visible={visible} />
          <Link
            href="/dashboard"
            className="mt-auto px-3 text-sm text-ink-soft underline-offset-4 hover:underline"
          >
            ← Back to my dashboard
          </Link>
        </aside>
        <div className="flex min-w-0 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-line bg-canvas/85 px-4 backdrop-blur-md sm:px-6 lg:px-10">
            <AdminMobileNav visible={visible} />
            <Logo href="/admin" className="lg:hidden" />
            <Badge variant="outline" className="ml-2 hidden sm:inline-flex">
              {roleLabel}
            </Badge>
            <div className="ml-auto flex items-center gap-3">
              <ThemeToggle />
              <UserMenu user={user} />
            </div>
          </header>
          <main id="main" className="w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
            {children}
          </main>
        </div>
      </div>
    </StudioProviders>
  );
}
