import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Pencil, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { InvitationCover } from "@/components/dashboard/InvitationCover";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { templateSwatch } from "@/components/dashboard/swatch";
import { formatRelative, formatShortDate } from "@/lib/format-date";
import { requireUserOrRedirect } from "@/server/auth/session";
import { getOverviewStats, listInvitations } from "@/server/services/invitations";
import { listAvailableTemplates } from "@/server/services/templates";

export const metadata: Metadata = { title: "Overview" };

function greeting(date = new Date()) {
  const h = Number(
    new Intl.DateTimeFormat("en-IN", {
      hour: "numeric",
      hour12: false,
      timeZone: "Asia/Kolkata",
    }).format(date),
  );
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default async function OverviewPage() {
  const user = await requireUserOrRedirect("/dashboard");
  const ctx = { userId: user.id };
  const [stats, recent, templates] = await Promise.all([
    getOverviewStats(ctx),
    listInvitations(ctx, { status: "ACTIVE", take: 5 }),
    listAvailableTemplates(),
  ]);
  const firstName = user.name?.split(" ")[0];
  const latest = recent[0];

  const STATS = [
    { label: "Invitations", value: stats.invitations },
    { label: "Published", value: stats.published },
    { label: "Guests", value: stats.guests },
    { label: "Opens", value: stats.opens },
  ];

  return (
    <div className="space-y-10">
      <PageHeader
        title={`${greeting()}${firstName ? `, ${firstName}` : ""}`}
        description="Here's what's happening with your invitations."
      />

      <section aria-label="Summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="rounded-lg bg-surface p-5 shadow-card">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="mt-2 font-display text-3xl font-semibold tabular-nums">{s.value}</p>
          </div>
        ))}
      </section>

      {latest ? (
        <>
          <section
            aria-labelledby="continue"
            className="overflow-hidden rounded-lg bg-surface shadow-card sm:flex"
          >
            <InvitationCover
              title={latest.title}
              coverImageUrl={latest.coverImageUrl}
              swatch={templateSwatch(latest.templateSlug)}
              className="aspect-[16/9] sm:aspect-auto sm:w-72"
            />
            <div className="flex flex-1 flex-col justify-center gap-3 p-6">
              <p id="continue" className="text-eyebrow text-maroon">
                Continue editing
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-2xl font-semibold">{latest.title}</h2>
                <StatusPill
                  status={latest.status}
                  unpublishedChanges={latest.hasUnpublishedChanges}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {latest.templateName} · {formatShortDate(latest.weddingDate)} · edited{" "}
                {formatRelative(latest.updatedAt)}
              </p>
              <div className="mt-2 flex gap-2">
                <Button asChild className="rounded-full">
                  <Link href={`/dashboard/invitations/${latest.id}/edit`}>
                    <Pencil /> Edit
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          {recent.length > 1 && (
            <section aria-labelledby="recent" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 id="recent" className="font-display text-xl font-semibold">
                  Recent invitations
                </h2>
                <Link
                  href="/dashboard/invitations"
                  className="inline-flex items-center gap-1 text-sm font-medium text-maroon hover:underline"
                >
                  View all <ArrowRight className="size-4" />
                </Link>
              </div>
              <ul className="divide-y divide-line rounded-lg bg-surface shadow-card">
                {recent.slice(1).map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/dashboard/invitations/${r.id}/edit`}
                      className="flex items-center gap-3 px-5 py-4 hover:bg-muted/50"
                    >
                      <span
                        className="size-9 shrink-0 rounded-md"
                        style={{ background: templateSwatch(r.templateSlug).bg }}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{r.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {r.templateName} · {formatShortDate(r.weddingDate)}
                        </span>
                      </span>
                      <StatusPill status={r.status} unpublishedChanges={r.hasUnpublishedChanges} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      ) : (
        <EmptyState
          icon={<Sparkles className="size-6" />}
          title="Create your first invitation"
          description="Pick a design, add your names and events, and watch it come alive in the live preview."
          action={
            <Button asChild className="h-11 rounded-full px-6">
              <Link href="/dashboard/invitations/new">
                <Plus /> Create invitation
              </Link>
            </Button>
          }
        />
      )}

      <section aria-labelledby="start" className="space-y-4">
        <h2 id="start" className="font-display text-xl font-semibold">
          Start something new
        </h2>
        <ul className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
          {templates.map((t) => (
            <li key={t.slug} className="w-64 shrink-0 snap-start sm:w-auto">
              <Link
                href={`/dashboard/invitations/new?template=${t.slug}`}
                className="block overflow-hidden rounded-lg bg-surface shadow-card transition-shadow hover:shadow-float"
              >
                <div
                  className="grid aspect-[16/10] place-items-center"
                  style={{ background: t.swatch.bg }}
                >
                  <span className="font-display text-2xl" style={{ color: t.swatch.accent }}>
                    {t.name}
                  </span>
                </div>
                <div className="p-4">
                  <p className="font-medium">{t.name}</p>
                  <p className="text-sm text-muted-foreground">{t.styleLabel}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
