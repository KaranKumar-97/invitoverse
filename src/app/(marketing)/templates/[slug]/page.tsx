import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ChevronRight, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/marketing/JsonLd";
import { TemplateCard } from "@/components/marketing/TemplateCard";
import { TemplatePreviewer } from "@/components/marketing/TemplatePreviewer";
import { TrackedLink } from "@/components/marketing/TrackedLink";
import { SECTION_LABELS } from "@/lib/invitation/section-labels";
import {
  CATEGORIES,
  ENVELOPE_STYLE,
  REVEAL_STYLE,
  relatedTemplates,
  templateMedia,
} from "@/lib/marketing/catalogue";
import { SITE } from "@/lib/marketing/site";
import { getManifest, TEMPLATE_SLUGS } from "@/templates/registry";

type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return TEMPLATE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const m = getManifest((await params).slug);
  if (!m) return {};
  const media = templateMedia(m.slug);
  const title = `${m.name} — Animated Wedding Invitation`;
  return {
    title: { absolute: `${title} | ${SITE.name}` },
    description: m.description,
    alternates: { canonical: `/templates/${m.slug}` },
    openGraph: {
      title,
      description: m.tagline,
      url: `/templates/${m.slug}`,
      images: [{ url: media.og, width: 1200, height: 630, alt: `${m.name} invitation` }],
    },
    twitter: { card: "summary_large_image", images: [media.og] },
  };
}

export default async function TemplateDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const m = getManifest(slug);
  if (!m) notFound();
  const media = templateMedia(m.slug);
  const category = CATEGORIES.find((c) => c.id === m.category);
  const related = relatedTemplates(m.slug);

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-1 text-sm text-muted-foreground">
            <li>
              <Link href="/" className="hover:text-ink">
                Home
              </Link>
            </li>
            <ChevronRight className="size-3.5" aria-hidden />
            <li>
              <Link href="/templates" className="hover:text-ink">
                Designs
              </Link>
            </li>
            <ChevronRight className="size-3.5" aria-hidden />
            <li aria-current="page" className="text-ink">
              {m.name}
            </li>
          </ol>
        </nav>
      </div>

      <section className="mx-auto grid max-w-7xl gap-x-16 gap-y-12 px-4 pt-8 pb-16 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:grid-rows-[auto_1fr] lg:px-8 lg:pb-24">
        <div className="lg:col-start-2">
          {category && (
            <Link
              href={`/templates?category=${category.param}`}
              className="text-eyebrow text-maroon hover:underline"
            >
              {category.label}
            </Link>
          )}
          <h1 className="text-display-l mt-3">{m.name}</h1>
          <p className="mt-3 font-display text-xl text-ink-soft italic">{m.tagline}</p>
          <p className="mt-5 text-ink-soft">{m.description}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild className="h-12 rounded-full px-7 text-base">
              <TrackedLink
                href={`/dashboard/invitations/new?template=${m.slug}`}
                event="template_use_click"
                data={{ template: m.slug }}
              >
                <Wand2 className="size-4" /> Use this design
              </TrackedLink>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 rounded-full bg-surface px-7 text-base"
            >
              <TrackedLink
                href={`/templates/${m.slug}/preview`}
                event="cta_live_invite"
                data={{ from: "detail", template: m.slug }}
              >
                <Sparkles className="size-4" /> Open live demo
              </TrackedLink>
            </Button>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Free during beta · Edit any time after sharing
          </p>
        </div>

        <div className="lg:col-start-1 lg:row-span-2 lg:row-start-1">
          <TemplatePreviewer
            slug={m.slug}
            name={m.name}
            poster={media.poster}
            palettes={m.palettes.map((p) => ({
              id: p.id,
              name: p.name,
              bg: p.colors.bg,
              accent: p.colors.accent,
            }))}
            fontPairs={m.fontPairs.map((f) => ({ id: f.id, name: f.name }))}
          />
        </div>

        <div className="border-t border-line pt-8 lg:col-start-2">
          <h2 className="text-lg font-semibold">What&apos;s inside</h2>
          <dl className="mt-5 grid gap-5 text-sm sm:grid-cols-2">
            <Detail label="Opening">
              {ENVELOPE_STYLE[m.animation.intro] ?? "Animated envelope"}
            </Detail>
            <Detail label="Animation">
              {REVEAL_STYLE[m.animation.sectionReveal] ?? "Scroll reveals"}
            </Detail>
            <Detail label="Palettes">{m.palettes.map((p) => p.name).join(" · ")}</Detail>
            <Detail label="Typography">{m.fontPairs.map((f) => f.name).join(" · ")}</Detail>
          </dl>
          <ul className="mt-6 flex flex-wrap gap-2">
            {m.supportedSections.map((s) => (
              <li
                key={s}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-sm"
              >
                <Check className="size-3.5 text-maroon" /> {SECTION_LABELS[s]}
              </li>
            ))}
            {m.media.music && (
              <li className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-sm">
                <Check className="size-3.5 text-maroon" /> Music
              </li>
            )}
          </ul>
        </div>
      </section>

      {related.length > 0 && (
        <section className="border-t border-line bg-surface py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-3xl font-semibold tracking-tight">
              You may also like
            </h2>
            <ul className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 min-[481px]:grid-cols-2 lg:grid-cols-4">
              {related.map((t) => (
                <li key={t.slug}>
                  <TemplateCard item={t} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: `${m.name} — Animated Wedding Invitation`,
          description: m.description,
          image: `${SITE.url}${media.og}`,
          url: `${SITE.url}/templates/${m.slug}`,
          category: "Digital wedding invitation",
          brand: { "@type": "Brand", name: SITE.name },
        }}
      />
    </>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium">{children}</dd>
    </div>
  );
}
