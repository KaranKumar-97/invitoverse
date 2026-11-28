import type { Metadata } from "next";
import Link from "next/link";
import { DayBars, RankBars } from "@/components/admin/charts";
import { requireAdminPage } from "@/server/auth/admin";
import { getPlatformAnalytics, RANGES, type RangeDays } from "@/server/services/admin-analytics";

export const metadata: Metadata = { title: "Analytics" };

const nf = new Intl.NumberFormat("en-IN");
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "—");
const change = (now: number, before: number) => {
  if (!before) return now ? "new" : "no change";
  const d = Math.round(((now - before) / before) * 100);
  return `${d > 0 ? "+" : ""}${d}% vs previous`;
};

/** Platform analytics (docs/19 §4.4): sign-ups, publishing, opens, funnel, templates, music. */
export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const { user } = await requireAdminPage("analytics.view");
  const { days: q } = await searchParams;
  const days = (RANGES.find((r) => String(r) === q) ?? 30) as RangeDays;
  const a = await getPlatformAnalytics({ userId: user.id }, days);
  const f = a.funnel;
  const tiles = [
    ["Sign-ups", nf.format(a.signups.total), change(a.signups.total, a.signups.previous)],
    [
      "Invitations created",
      nf.format(a.created.reduce((s, p) => s + p.value, 0)),
      `${nf.format(a.published.reduce((s, p) => s + p.value, 0))} published`,
    ],
    ["Invitation opens", nf.format(a.opens.total), change(a.opens.total, a.opens.previous)],
    [
      "Guest open rate",
      pct(a.guests.opened, a.guests.added),
      `${nf.format(a.guests.added)} guests added`,
    ],
  ] as const;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Last {days} days. Counts only — no personal data.
          </p>
        </div>
        <nav aria-label="Date range" className="flex gap-2">
          {RANGES.map((r) => (
            <Link
              key={r}
              href={`/admin/analytics?days=${r}`}
              aria-current={r === days ? "page" : undefined}
              className={`rounded-full border px-3 py-1 text-sm ${r === days ? "border-transparent bg-primary text-primary-foreground" : "border-line bg-surface text-ink-soft"}`}
            >
              {r} days
            </Link>
          ))}
        </nav>
      </div>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map(([label, value, sub]) => (
          <div key={label} className="rounded-xl border border-line bg-surface p-4">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="mt-1 font-display text-3xl font-semibold tabular-nums">{value}</dd>
            <dd className="mt-1 text-xs text-ink-soft">{sub}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <DayBars title="Sign-ups per day" points={a.signups.series} />
        <DayBars title="Invitation opens per day" points={a.opens.series} />
        <DayBars title="Invitations created per day" points={a.created} />
        <DayBars title="Invitations published per day" points={a.published} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <RankBars
          title="Funnel"
          note={`Accounts that signed up in the last ${days} days`}
          rows={[
            { label: "Signed up", value: f.signed },
            { label: "Created an invitation", value: f.created, detail: pct(f.created, f.signed) },
            { label: "Published", value: f.published, detail: pct(f.published, f.signed) },
            { label: "Added guests", value: f.shared, detail: pct(f.shared, f.signed) },
            { label: "A guest opened it", value: f.opened, detail: pct(f.opened, f.signed) },
          ]}
        />
        <RankBars
          title="Templates"
          note="Invitations created in the range (published in brackets)"
          rows={a.templates.map((t) => ({
            label: t.name,
            value: t.created,
            detail: `(${t.published})`,
          }))}
        />
        <RankBars
          title="Music picked"
          note="Library songs on invitations created in the range"
          rows={a.music.map((m) => ({ label: m.title, value: m.count }))}
        />
      </div>
      <p className="mt-6 text-xs text-muted-foreground">
        Site traffic (page views, referrers) is in Vercel Analytics.
      </p>
    </div>
  );
}
