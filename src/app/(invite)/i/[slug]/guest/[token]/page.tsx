import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { coupleTitle } from "@/lib/invitation/couple";
import { formatLongDate } from "@/lib/invitation/dates";
import { resolveRenderable } from "@/lib/invitation/resolve";
import { clientIp, peekCount, rateLimit } from "@/server/integrations/ratelimit";
import { getGuestView, getPublishedInvitationBySlug } from "@/server/services/public-invitations";
import { templateComponents } from "@/templates/components";
import { getManifest, isTemplateSlug, type TemplateSlug } from "@/templates/registry";

type Params = { slug: string; token: string };

export const dynamic = "force-dynamic";

/** Invitation-level metadata only: link previews get forwarded, so no guest names here. */
export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const inv = await getPublishedInvitationBySlug((await params).slug);
  if (!inv) return { title: "Invitation", robots: { index: false, follow: false } };
  const title = `${coupleTitle(inv.content.couple)} — ${formatLongDate(inv.content.weddingDate)}`;
  const description = "You're invited to our wedding celebrations.";
  const image = `/api/og/${inv.slug}?v=${inv.publishedVersion}`;
  return {
    title: { absolute: title },
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

/**
 * Personal invitation (docs/07-guest-links-and-privacy.md §4). Events the guest isn't invited to
 * are filtered on the server and never reach the browser.
 */
export default async function GuestInvitationPage({ params }: { params: Promise<Params> }) {
  const { slug, token } = await params;
  const ip = clientIp(await headers());

  // Blunt token guessing: coarse per-IP limit, and a lockout after repeated invalid tokens.
  const BAD_WINDOW = 10 * 60_000;
  const coarse = await rateLimit(`guest-page:${ip}`, 120, 60_000);
  if (!coarse.ok || (await peekCount(`guest-bad:${ip}`, BAD_WINDOW)) >= 10) notFound();

  const view = await getGuestView(slug, token);
  if (!view || !isTemplateSlug(view.invitation.templateSlug)) {
    await rateLimit(`guest-bad:${ip}`, 10, BAD_WINDOW); // count only invalid attempts
    notFound();
  }
  const { invitation: inv, guest } = view;
  const templateSlug = inv.templateSlug as TemplateSlug;
  const data = resolveRenderable({
    manifest: getManifest(templateSlug)!,
    content: inv.content,
    design: inv.design,
    mode: "GUEST",
    key: `inv:${inv.slug}:v${inv.publishedVersion}:g:${token}`,
    guest,
    links: { beacon: { slug: inv.slug, token }, icsBase: `/api/v1/ics/${inv.slug}` },
  });
  const Template = templateComponents[templateSlug];
  return <Template data={data} />;
}
