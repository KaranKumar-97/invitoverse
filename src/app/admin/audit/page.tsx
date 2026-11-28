import type { Metadata } from "next";
import { requireAdminPage } from "@/server/auth/admin";
import { listAuditLog } from "@/server/services/admin-team";

export const metadata: Metadata = { title: "Audit log" };

const ACTIONS: Record<string, string> = {
  "admin.added": "Added an admin",
  "admin.removed": "Removed an admin",
  "admin.role_changed": "Changed a role",
  "admin.permission_changed": "Changed permissions",
  "admin.preset_applied": "Applied a preset",
};

/** Every admin change, newest first (docs/19 §4.7). Read-only, append-only. */
export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string }>;
}) {
  const { user } = await requireAdminPage("audit.view");
  const { cursor } = await searchParams;
  const { rows, nextCursor } = await listAuditLog({ userId: user.id }, { cursor });
  const fmt = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" });
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Audit log</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Every admin change, newest first. Entries can&apos;t be edited or deleted.
      </p>
      <ol className="mt-8 divide-y divide-line rounded-xl border border-line bg-surface">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-col gap-1 px-5 py-3 text-sm sm:flex-row sm:gap-4">
            <time dateTime={r.createdAt.toISOString()} className="shrink-0 text-ink-soft sm:w-44">
              {fmt.format(r.createdAt)}
            </time>
            <div className="min-w-0">
              <p>
                <span className="font-medium">{r.actor?.email ?? "Unknown"}</span>{" "}
                {(ACTIONS[r.action] ?? r.action).toLowerCase()}{" "}
                <span className="text-ink-soft">
                  ({r.targetType} {r.targetId})
                </span>
              </p>
              {r.after != null && (
                <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                  {JSON.stringify(r.after)}
                </p>
              )}
              {r.reason && <p className="mt-0.5 text-xs italic">{r.reason}</p>}
            </div>
          </li>
        ))}
        {!rows.length && <li className="px-5 py-3 text-sm text-ink-soft">No changes yet.</li>}
      </ol>
      {nextCursor && (
        <a
          href={`/admin/audit?cursor=${nextCursor}`}
          className="mt-4 inline-block text-sm underline underline-offset-4"
        >
          Older entries →
        </a>
      )}
    </div>
  );
}
