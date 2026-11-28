import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AccessGrants, UserAccountControls } from "@/components/admin/UserAdminPanel";
import { SuspendButton } from "@/components/admin/UserControls";
import { templateManifests, TEMPLATE_SLUGS } from "@/templates/registry";
import { Badge } from "@/components/ui/badge";
import { AppError } from "@/lib/action-result";
import { requireAdminPage } from "@/server/auth/admin";
import { DayBars } from "@/components/admin/charts";
import { getUserAnalytics } from "@/server/services/admin-analytics";
import { getUserDetail } from "@/server/services/admin-users";

export const metadata: Metadata = { title: "User" };

const fmt = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" });
const nf = new Intl.NumberFormat("en-IN");

/** One user: profile, sign-in, access grants, media and every invitation (docs/19 §4.2). */
export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, access } = await requireAdminPage("users.view");
  const { id } = await params;
  const u = await getUserDetail({ userId: user.id }, id).catch((e) => {
    if (e instanceof AppError) notFound();
    throw e;
  });
  const stats = access.permissions.has("analytics.view")
    ? await getUserAnalytics({ userId: user.id }, u.id)
    : null;
  const notSelfOrSuper = u.id !== user.id && u.role !== "SUPERADMIN";
  const canEdit = access.permissions.has("users.edit") && notSelfOrSuper;
  const canDelete = access.permissions.has("users.delete") && notSelfOrSuper;
  const canGrant = access.permissions.has("users.entitlements");
  const templateOptions = TEMPLATE_SLUGS.map((slug) => ({
    slug,
    name: templateManifests[slug].name,
  }));

  return (
    <div>
      <Link
        href="/admin/users"
        className="text-sm text-ink-soft underline-offset-4 hover:underline"
      >
        ← Users
      </Link>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate font-display text-3xl font-semibold tracking-tight">
            {u.name || u.email}
          </h1>
          <p className="truncate text-sm text-muted-foreground">{u.email}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="outline">{u.role === "USER" ? "Couple" : u.role.toLowerCase()}</Badge>
            {u.suspended && <Badge variant="destructive">Suspended</Badge>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && <SuspendButton userId={u.id} suspended={u.suspended} />}
          <UserAccountControls
            userId={u.id}
            email={u.email}
            name={u.name}
            canEdit={access.permissions.has("users.edit")}
            canDelete={canDelete}
          />
        </div>
      </div>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Joined", fmt.format(new Date(u.createdAt))],
          ["Signs in with", u.providers.join(", ") || "Email link"],
          ["Session until", u.sessionUntil ? fmt.format(new Date(u.sessionUntil)) : "Signed out"],
          [
            "Media",
            `${nf.format(u.media.count)} files · ${nf.format(Math.round(u.media.bytes / 1048576))} MB`,
          ],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl border border-line bg-surface p-4">
            <dt className="text-sm text-muted-foreground">{k}</dt>
            <dd className="mt-1 font-medium">{v}</dd>
          </div>
        ))}
      </dl>

      {stats && (
        <div className="mt-6 grid gap-4 lg:grid-cols-[2fr_1fr]">
          <DayBars title="Opens, last 30 days" points={stats.opens} />
          <div className="rounded-xl border border-line bg-surface p-4">
            <p className="text-sm text-muted-foreground">Guest open rate</p>
            <p className="mt-1 font-display text-3xl font-semibold tabular-nums">
              {stats.guests.total
                ? `${Math.round((stats.guests.opened / stats.guests.total) * 100)}%`
                : "—"}
            </p>
            <p className="mt-1 text-xs text-ink-soft">
              {stats.guests.opened} of {stats.guests.total} guests opened their link
            </p>
          </div>
        </div>
      )}

      <h2 className="mt-10 text-lg font-semibold">Invitations</h2>
      <ul className="mt-3 divide-y divide-line rounded-xl border border-line bg-surface">
        {u.invitations.map((i) => (
          <li key={i.id}>
            <Link
              href={`/admin/users/${u.id}/invitations/${i.id}`}
              className="flex flex-col gap-1 px-5 py-3 hover:bg-muted sm:flex-row sm:items-center sm:gap-4"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {i.title}{" "}
                  <Badge
                    variant={i.status === "PUBLISHED" ? "default" : "secondary"}
                    className="ml-1"
                  >
                    {i.disabled ? "Taken down" : i.status.toLowerCase()}
                  </Badge>
                </p>
                <p className="truncate font-mono text-sm text-muted-foreground">/i/{i.slug}</p>
              </div>
              <p className="text-sm text-ink-soft">
                {i.templateSlug} · {i.guests} guests · {i.openCount} opens
              </p>
              <p className="text-sm text-muted-foreground sm:w-32 sm:text-right">
                edited {fmt.format(new Date(i.updatedAt))}
              </p>
            </Link>
          </li>
        ))}
        {!u.invitations.length && <li className="px-5 py-3 text-sm">No invitations yet.</li>}
      </ul>

      <h2 className="mt-10 text-lg font-semibold">Access grants</h2>
      <div className="mt-3">
        <AccessGrants
          userId={u.id}
          templates={templateOptions}
          canEdit={canGrant}
          grants={u.entitlements.map((e) => ({
            id: e.id,
            label: `${e.templateSlug ?? e.type.toLowerCase()} · ${e.source.toLowerCase().replace("_", " ")}${e.expiresAt ? ` · until ${fmt.format(new Date(e.expiresAt))}` : ""}`,
          }))}
        />
      </div>
    </div>
  );
}
