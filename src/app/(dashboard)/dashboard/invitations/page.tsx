import type { Metadata } from "next";
import Link from "next/link";
import { LayoutGrid, List, Mail, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { InvitationGrid, InvitationTable } from "@/components/dashboard/InvitationGrid";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { cn } from "@/lib/utils";
import { requireUserOrRedirect } from "@/server/auth/session";
import { getOverviewStats, listInvitations } from "@/server/services/invitations";

export const metadata: Metadata = { title: "Invitations" };

const TABS = [
  { key: "all", label: "All", status: "ACTIVE" as const },
  { key: "drafts", label: "Drafts", status: "DRAFT" as const },
  { key: "published", label: "Published", status: "PUBLISHED" as const },
  { key: "archived", label: "Archived", status: "ARCHIVED" as const },
];

type Search = { tab?: string; q?: string; view?: string };

export default async function InvitationsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await requireUserOrRedirect("/dashboard/invitations");
  const { tab: tabKey = "all", q = "", view = "grid" } = await searchParams;
  const tab = TABS.find((t) => t.key === tabKey) ?? TABS[0];
  const ctx = { userId: user.id };
  const [items, stats] = await Promise.all([
    listInvitations(ctx, { status: tab.status, q }),
    getOverviewStats(ctx),
  ]);
  const counts: Record<string, number> = {
    all: stats.invitations,
    drafts: stats.drafts,
    published: stats.published,
    archived: stats.archived,
  };

  const href = (over: Partial<Search>) => {
    const p = new URLSearchParams({ tab: tab.key, ...(q ? { q } : {}), view, ...over } as Record<
      string,
      string
    >);
    if (p.get("tab") === "all") p.delete("tab");
    if (p.get("view") === "grid") p.delete("view");
    if (!p.get("q")) p.delete("q");
    const s = p.toString();
    return `/dashboard/invitations${s ? `?${s}` : ""}`;
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Invitations"
        actions={
          <Button asChild className="rounded-full">
            <Link href="/dashboard/invitations/new">
              <Plus /> Create invitation
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Filter by status" className="-mx-1 flex gap-1 overflow-x-auto px-1">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={href({ tab: t.key })}
              aria-current={t.key === tab.key ? "page" : undefined}
              className={cn(
                "inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors",
                t.key === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface text-ink-soft hover:text-ink",
              )}
            >
              {t.label}
              <span
                className={cn(
                  "text-xs tabular-nums",
                  t.key === tab.key ? "text-primary-foreground/70" : "text-muted-foreground",
                )}
              >
                {counts[t.key]}
              </span>
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <form
            action="/dashboard/invitations"
            className="relative flex-1 lg:w-72 lg:flex-none"
            role="search"
          >
            {tab.key !== "all" && <input type="hidden" name="tab" value={tab.key} />}
            {view !== "grid" && <input type="hidden" name="view" value={view} />}
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search invitations"
              aria-label="Search invitations"
              className="h-10 w-full rounded-full border border-line bg-surface pr-4 pl-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </form>
          <div
            className="flex rounded-full border border-line bg-surface p-0.5"
            role="group"
            aria-label="View"
          >
            {(["grid", "table"] as const).map((v) => (
              <Link
                key={v}
                href={href({ view: v })}
                aria-label={v === "grid" ? "Grid view" : "Table view"}
                aria-current={view === v ? "true" : undefined}
                className={cn(
                  "grid size-9 place-items-center rounded-full",
                  view === v
                    ? "bg-primary text-primary-foreground"
                    : "text-ink-soft hover:text-ink",
                )}
              >
                {v === "grid" ? <LayoutGrid className="size-4" /> : <List className="size-4" />}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<Mail className="size-6" />}
          title={
            q
              ? "No matches"
              : tab.key === "archived"
                ? "Nothing archived"
                : tab.key === "all"
                  ? "No invitations yet"
                  : `No ${tab.label.toLowerCase()} invitations`
          }
          description={
            q
              ? `Nothing matches “${q}”.`
              : tab.key === "all"
                ? "Create your first invitation — it only takes a minute."
                : "Invitations will appear here when their status changes."
          }
          action={
            tab.key === "all" && !q ? (
              <Button asChild className="h-11 rounded-full px-6">
                <Link href="/dashboard/invitations/new">
                  <Plus /> Create invitation
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : view === "table" ? (
        <InvitationTable items={items} />
      ) : (
        <InvitationGrid items={items} />
      )}
    </div>
  );
}
