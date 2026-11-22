import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { HeaderShell } from "./HeaderShell";
import { AccountLink } from "./AccountLink";
import { MobileMenu } from "./MobileMenu";
import { MAIN_NAV } from "./nav";

export function SiteHeader() {
  return (
    <HeaderShell>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 md:gap-5 lg:gap-6 lg:px-8">
        <Logo />
        <nav
          aria-label="Main"
          className="hidden items-center gap-5 text-sm font-medium text-ink-soft md:flex lg:gap-7"
        >
          {MAIN_NAV.map((n) => (
            <Link key={n.href} href={n.href} className="transition-colors hover:text-ink">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle className="mr-1 hidden sm:inline-flex" />
          <AccountLink className="hidden px-3 text-sm font-medium text-ink-soft hover:text-ink md:block" />
          <Button asChild className="h-10 rounded-full px-4 sm:px-5">
            <Link href="/dashboard/invitations/new">
              <span className="sm:hidden">Create</span>
              <span className="hidden sm:inline">Create invitation</span>
            </Link>
          </Button>
          <MobileMenu />
        </div>
      </div>
    </HeaderShell>
  );
}
