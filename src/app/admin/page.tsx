import type { Metadata } from "next";
import { requireAdminPage } from "@/server/auth/admin";
import { getPlatformStats } from "@/server/services/admin";

export const metadata: Metadata = { title: "Overview" };

const nf = new Intl.NumberFormat("en-IN");
const mb = (bytes: number) => `${nf.format(Math.round(bytes / 1024 / 1024))} MB`;

/** Read-only platform stats for any admin (docs/19 §3). Everyone else: 404. */
export default async function AdminPage() {
  await requireAdminPage();
  const s = await getPlatformStats();
  const tiles = [
    ["Accounts", nf.format(s.users.total), `+${nf.format(s.users.last7d)} this week`],
    ["Published", nf.format(s.invitations.published), `${nf.format(s.invitations.draft)} drafts`],
    [
      "Archived / disabled",
      `${nf.format(s.invitations.archived)} / ${nf.format(s.invitations.disabled)}`,
      "",
    ],
    ["Guests", nf.format(s.guests.total), `${nf.format(s.guests.opened)} opened`],
    ["Invitation opens", nf.format(s.opens), ""],
    ["Media", nf.format(s.media.assets), mb(s.media.bytes)],
  ] as const;

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Platform overview</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Read-only. Counts only — no personal data.
      </p>
      <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map(([label, value, sub]) => (
          <div key={label} className="rounded-xl border border-line bg-surface p-5">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="mt-2 font-display text-3xl font-semibold">{value}</dd>
            {sub && <dd className="mt-1 text-sm text-ink-soft">{sub}</dd>}
          </div>
        ))}
      </dl>
      <h2 className="mt-10 text-lg font-semibold">Recently published</h2>
      <ul className="mt-3 divide-y divide-line rounded-xl border border-line bg-surface">
        {s.recentPublishes.map((r) => (
          <li key={r.slug} className="flex flex-wrap justify-between gap-2 px-5 py-3 text-sm">
            <a href={`/i/${r.slug}`} className="font-medium text-maroon hover:underline">
              /i/{r.slug}
            </a>
            <span className="text-ink-soft">
              {r.templateSlug} ·{" "}
              {r.publishedAt ? new Date(r.publishedAt).toLocaleString("en-IN") : "—"}
            </span>
          </li>
        ))}
        {!s.recentPublishes.length && (
          <li className="px-5 py-3 text-sm text-ink-soft">Nothing yet.</li>
        )}
      </ul>
    </div>
  );
}
