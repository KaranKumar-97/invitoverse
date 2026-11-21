"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { DASHBOARD_NAV } from "./nav";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Dashboard" className="flex flex-col gap-1">
      {DASHBOARD_NAV.map(({ href, label, icon: Icon, external }) => {
        const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-ink-soft transition-colors hover:bg-muted hover:text-ink",
              active && "bg-surface text-ink shadow-card",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            <span className="flex-1">{label}</span>
            {external && (
              <ArrowUpRight className="size-3.5 text-muted-foreground" aria-hidden="true" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
