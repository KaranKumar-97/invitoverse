import Link from "next/link";
import { Plus } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { SidebarNav } from "@/components/dashboard/SidebarNav";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { UserMenu } from "@/components/dashboard/UserMenu";
import { requireUserOrRedirect } from "@/server/auth/session";
import { StudioProviders } from "@/components/StudioProviders";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Real auth check (middleware only checks for a cookie).
  const user = await requireUserOrRedirect("/dashboard");

  return (
    <StudioProviders>
      <div className="min-h-dvh lg:grid lg:grid-cols-[240px_1fr]">
        <aside className="sticky top-0 hidden h-dvh flex-col gap-8 border-r border-line px-4 py-6 lg:flex">
          <Logo href="/dashboard" className="px-3" />
          <SidebarNav />
          <div className="mt-auto">
            <Button asChild className="h-11 w-full rounded-full">
              <Link href="/dashboard/invitations/new">
                <Plus /> Create invitation
              </Link>
            </Button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-line bg-canvas/85 px-4 backdrop-blur-md sm:px-6 lg:px-10">
            <MobileNav />
            <Logo href="/dashboard" className="lg:hidden" />
            <div className="ml-auto flex items-center gap-3">
              <Button asChild size="sm" className="hidden rounded-full sm:inline-flex lg:hidden">
                <Link href="/dashboard/invitations/new">
                  <Plus /> Create
                </Link>
              </Button>
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
