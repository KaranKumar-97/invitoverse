import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { coupleTitle } from "@/lib/invitation/couple";
import { formatLongDate } from "@/lib/invitation/dates";
import { resolveRenderable } from "@/lib/invitation/resolve";
import { getPublishedInvitationBySlug } from "@/server/services/public-invitations";
import { templateComponents } from "@/templates/components";
import { getManifest, isTemplateSlug } from "@/templates/registry";

type Params = { slug: string };

// Rendered on first request, then cached until a publish/unpublish purges the slug's tag (ISR).
export const dynamicParams = true;
export async function generateStaticParams(): Promise<Params[]> {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const inv = await getPublishedInvitationBySlug((await params).slug);
  if (!inv) return { title: "Invitation", robots: { index: false, follow: false } };
  const title = `${coupleTitle(inv.content.couple)} — ${formatLongDate(inv.content.weddingDate)}`;
  const description = (
    inv.content.messages.welcome || "You're invited to our wedding celebrations."
  ).slice(0, 180);
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

/** Public invitation: published snapshot only (docs/06-publishing-workflow.md §5). */
export default async function PublicInvitationPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const inv = await getPublishedInvitationBySlug(slug);
  if (!inv || !isTemplateSlug(inv.templateSlug)) notFound();
  const data = resolveRenderable({
    manifest: getManifest(inv.templateSlug)!,
    content: inv.content,
    design: inv.design,
    mode: "PUBLIC",
    key: `inv:${inv.slug}:v${inv.publishedVersion}`,
    links: { beacon: { slug: inv.slug }, icsBase: `/api/v1/ics/${inv.slug}` },
  });
  const Template = templateComponents[inv.templateSlug];
  return <Template data={data} />;
}
