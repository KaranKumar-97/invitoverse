import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PublishPanel } from "@/components/share/PublishPanel";
import { AppError } from "@/lib/action-result";
import { requireUserOrRedirect } from "@/server/auth/session";
import { getInvitationForEditor } from "@/server/services/invitations";
import { getPublishState } from "@/server/services/publishing";

export const metadata: Metadata = { title: "Publish & share" };

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUserOrRedirect(`/dashboard/invitations/${id}/share`);
  const ctx = { userId: user.id };
  const [inv, state] = await Promise.all([
    getInvitationForEditor(ctx, id),
    getPublishState(ctx, id),
  ]).catch((e) => {
    if (e instanceof AppError && e.code === "NOT_FOUND") notFound();
    throw e;
  });
  const c = inv.content.couple;
  const [a, b] =
    c.order === "GROOM_FIRST"
      ? [c.groom.firstName, c.bride.firstName]
      : [c.bride.firstName, c.groom.firstName];
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Link
        href="/dashboard/invitations"
        className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink"
      >
        <ArrowLeft className="size-4" /> Invitations
      </Link>
      <PageHeader
        title="Publish & share"
        description={inv.title}
        actions={
          <Button asChild variant="outline" className="rounded-full">
            <Link href={`/dashboard/invitations/${id}/edit`}>
              <Pencil /> Edit
            </Link>
          </Button>
        }
      />
      <section className="rounded-lg bg-surface p-5 shadow-card sm:p-6">
        <PublishPanel
          invitationId={id}
          appUrl={process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}
          coupleTitle={`${a || "Bride"} & ${b || "Groom"}`}
          initialState={state}
        />
      </section>
    </div>
  );
}
