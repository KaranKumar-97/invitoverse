import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { requireAdminPage } from "@/server/auth/admin";
import { listUsers, type UserFilter } from "@/server/services/admin-users";

export const metadata: Metadata = { title: "Users" };

const FILTERS = [
  ["all", "All"],
  ["active", "Active"],
  ["suspended", "Suspended"],
  ["admins", "Admins"],
] as const;

const fmt = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" });

/** Every account with invitation counts (docs/19 §4.2). */
export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const { user } = await requireAdminPage("users.view");
  const sp = await searchParams;
  const status = (FILTERS.find(([v]) => v === sp.status)?.[0] ?? "all") as UserFilter["status"];
  const q = (sp.q ?? "").slice(0, 100);
  const data = await listUsers({ userId: user.id }, { q, status, page: Number(sp.page) || 1 });
  const href = (p: Record<string, string | number>) =>
    `/admin/users?${new URLSearchParams({ q, status: status ?? "all", page: "1", ...Object.fromEntries(Object.entries(p).map(([k, v]) => [k, String(v)])) })}`;

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Users</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {data.total} account{data.total === 1 ? "" : "s"}.
      </p>
      <form className="mt-6 flex flex-col gap-3 sm:flex-row" action="/admin/users">
        <label className="sr-only" htmlFor="users-q">
          Search users
        </label>
        <input
          id="users-q"
          name="q"
          defaultValue={q}
          placeholder="Search by email or name"
          className="h-10 flex-1 rounded-md border border-line bg-surface px-3 text-sm"
        />
        <input type="hidden" name="status" value={status} />
        <button className="h-10 rounded-md border border-line bg-surface px-4 text-sm font-medium">
          Search
        </button>
      </form>
      <nav aria-label="Filter users" className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map(([v, label]) => (
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
      <ul className="mt-6 divide-y divide-line rounded-xl border border-line bg-surface">
        {data.users.map((u) => (
          <li key={u.id}>
            <Link
              href={`/admin/users/${u.id}`}
              className="flex flex-col gap-1 px-5 py-3 hover:bg-muted sm:flex-row sm:items-center sm:gap-4"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {u.name || u.email}
                  {u.role !== "USER" && (
                    <Badge variant="outline" className="ml-2">
                      {u.role === "SUPERADMIN" ? "Superadmin" : "Admin"}
                    </Badge>
                  )}
                  {u.suspended && (
                    <Badge variant="destructive" className="ml-2">
                      Suspended
                    </Badge>
                  )}
                </p>
                <p className="truncate text-sm text-muted-foreground">{u.email}</p>
              </div>
              <p className="text-sm text-ink-soft">
                {u.invitations.published} live · {u.invitations.draft} drafts ·{" "}
                {u.invitations.archived} archived
              </p>
              <p className="text-sm text-muted-foreground sm:w-28 sm:text-right">
                {fmt.format(new Date(u.createdAt))}
              </p>
            </Link>
          </li>
        ))}
        {!data.users.length && <li className="px-5 py-3 text-sm">No users match.</li>}
      </ul>
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
