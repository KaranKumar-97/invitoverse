import type { Metadata } from "next";
import Link from "next/link";
import { SitesManager } from "@/components/admin/SitesManager";
import { requireAdminPage } from "@/server/auth/admin";
import { listSites, type SiteFilter } from "@/server/services/admin-sites";

export const metadata: Metadata = { title: "Deployed sites" };

const STATES = [
  ["all", "All"],
  ["live", "Live"],
  ["down", "Taken down"],
  ["unpublished", "Unpublished"],
] as const;

/** Published invitations: open, rename, change link, (un)publish, take down, delete (docs/19 §4.5). */
export default async function AdminSitesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const { user, access } = await requireAdminPage("sites.view");
  const sp = await searchParams;
  const status = (STATES.find(([v]) => v === sp.status)?.[0] ?? "all") as SiteFilter["status"];
  const q = (sp.q ?? "").slice(0, 100);
  const page = Number(sp.page) || 1;
  const data = await listSites({ userId: user.id }, { q, status, page });
  const can = {
    publish: access.permissions.has("sites.publish"),
    settings: access.permissions.has("sites.settings"),
    takedown: access.permissions.has("sites.takedown"),
    delete: access.permissions.has("sites.delete"),
  };
  const href = (p: Record<string, string | number>) =>
    `/admin/sites?${new URLSearchParams({ q, status: status ?? "all", page: "1", ...Object.fromEntries(Object.entries(p).map(([k, v]) => [k, String(v)])) })}`;

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Deployed sites</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {data.total} site{data.total === 1 ? "" : "s"}. Changes apply on the owner&apos;s behalf and
        are recorded in the audit log.
      </p>
      <form className="mt-6 flex flex-col gap-3 sm:flex-row" action="/admin/sites">
        <label className="sr-only" htmlFor="sites-q">
          Search sites
        </label>
        <input
          id="sites-q"
          name="q"
          defaultValue={q}
          placeholder="Search by link, title or owner email"
          className="h-10 flex-1 rounded-md border border-line bg-surface px-3 text-sm"
        />
        <input type="hidden" name="status" value={status} />
        <button className="h-10 rounded-md border border-line bg-surface px-4 text-sm font-medium">
          Search
        </button>
      </form>
      <nav aria-label="Filter by state" className="mt-4 flex flex-wrap gap-2">
        {STATES.map(([v, label]) => (
          <Link
            key={v}
            href={href({ status: v })}
            aria-current={status === v ? "page" : undefined}
            className={`rounded-full border px-3 py-1 text-sm ${status === v ? "border-transparent bg-primary text-primary-foreground" : "border-line bg-surface text-ink-soft"}`}
          >
            {label}
          </Link>
        ))}
      </nav>
      <SitesManager sites={data.sites} can={can} />
      {data.pageCount > 1 && (
        <nav aria-label="Pages" className="mt-6 flex items-center gap-4 text-sm">
          {data.page > 1 && <Link href={href({ page: data.page - 1 })}>← Previous</Link>}
          <span className="text-muted-foreground">
            Page {data.page} of {data.pageCount}
          </span>
          {data.page < data.pageCount && <Link href={href({ page: data.page + 1 })}>Next →</Link>}
        </nav>
      )}
    </div>
  );
}
