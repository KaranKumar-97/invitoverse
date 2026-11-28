import type { Metadata } from "next";
import { getMusicLibrary } from "@/server/services/music";
import { notFound } from "next/navigation";
import { defaultDesign } from "@/lib/invitation/defaults";
import { IntensitySchema } from "@/lib/invitation/schema";
import { resolveRenderable } from "@/lib/invitation/resolve";
import { templateComponents } from "@/templates/components";
import { demoGuest } from "@/templates/demo-guest";
import { getManifest, isTemplateSlug, TEMPLATE_SLUGS, templateDemos } from "@/templates/registry";
import { DemoBar } from "@/components/marketing/DemoBar";

type Params = { slug: string };
type Search = {
  palette?: string;
  font?: string;
  intensity?: string;
  guest?: string;
  embed?: string;
  envelope?: string;
};

export function generateStaticParams(): Params[] {
  return TEMPLATE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const manifest = getManifest((await params).slug);
  if (!manifest) return {};
  return {
    title: `${manifest.name} — live demo`,
    description: manifest.description,
    alternates: { canonical: `/templates/${manifest.slug}` },
    robots: { index: false, follow: true },
  };
}

/** Full-screen demo of a template with demo data — exactly what a guest experiences (FR-P4). */
export default async function TemplatePreviewPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  const { slug } = await params;
  const search = await searchParams;
  if (!isTemplateSlug(slug)) notFound();

  const manifest = getManifest(slug)!;
  const demo = templateDemos[slug];
  const base = { ...defaultDesign(manifest), ...demo.design };
  const intensity = IntensitySchema.safeParse(search.intensity);
  const design = {
    ...base,
    paletteId: search.palette ?? base.paletteId,
    fontPairId: search.font ?? base.fontPairId,
    animation: {
      ...base.animation,
      ...(intensity.success ? { intensity: intensity.data } : {}),
      ...(search.envelope === "0" ? { envelope: false } : {}),
    },
  };
  const guest = search.guest === "1" ? demoGuest(demo.guestEventIds) : null;

  const data = resolveRenderable({
    manifest,
    content: demo.content,
    design,
    mode: "DEMO",
    key: `demo:${slug}:${guest ? "guest" : "public"}`,
    guest,
    library: await getMusicLibrary(),
  });
  const Template = templateComponents[slug];
  const embed = search.embed === "1";

  return (
    <>
      <Template data={data} />
      {!embed && (
        <DemoBar
          slug={slug}
          name={manifest.name}
          palettes={manifest.palettes.map((p) => ({
            id: p.id,
            name: p.name,
            swatch: [p.colors.bg, p.colors.accent],
          }))}
          fontPairs={manifest.fontPairs.map((f) => ({ id: f.id, name: f.name }))}
          current={{
            palette: data.theme.paletteId,
            font: data.theme.fontPairId,
            guest: Boolean(guest),
          }}
        />
      )}
    </>
  );
}
