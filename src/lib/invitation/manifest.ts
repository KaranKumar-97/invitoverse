/**
 * Template manifest contract (docs/05-template-engine.md §4.3, §6).
 * Manifests are plain data — no React — so the editor, catalogue and seed can import them cheaply.
 */
import { z } from "@/lib/zod";
import type { Intensity, PaletteKey, SectionKey } from "./schema";

export type TemplateCategory = "ROYAL" | "MINIMAL" | "FLORAL" | "CINEMATIC" | "MODERN";

export type Palette = { id: string; name: string; colors: Record<PaletteKey, string> };

/** Font families are display names; the template module maps each pair id to next/font CSS variables. */
export type FontPair = {
  id: string;
  name: string;
  display: string;
  heading: string;
  body: string;
  script?: string;
};

export type BackgroundPreset = { id: string; name: string; src: string | null };

type OptionBase = { key: string; label: string; description?: string };
export type TemplateOption =
  | (OptionBase & { type: "boolean"; default: boolean })
  | (OptionBase & {
      type: "select";
      default: string;
      choices: Array<{ value: string; label: string }>;
    });

export type TemplateManifest = {
  slug: string;
  name: string;
  version: number;
  category: TemplateCategory;
  tagline: string;
  description: string;
  /** Short catalogue descriptor, e.g. "Royal · Maroon & Gold". */
  styleLabel: string;
  supportedSections: readonly SectionKey[];
  defaultSections: readonly SectionKey[];
  palettes: readonly Palette[];
  customizablePaletteKeys: readonly PaletteKey[];
  fontPairs: readonly FontPair[];
  backgrounds: readonly BackgroundPreset[];
  allowCustomBackground: boolean;
  animation: {
    intro: string;
    sectionReveal: string;
    particles: string | null;
    /** Total opening-sequence duration per intensity (ms). */
    durationsMs: Record<Intensity, number>;
  };
  options: readonly TemplateOption[];
  media: {
    couplePhotos: { max: number };
    gallery: { max: number };
    video: boolean;
    music: boolean;
  };
  defaultMusicTrackId: string;
};

export const REQUIRED_SECTIONS: readonly SectionKey[] = ["hero", "events", "footer"];

/**
 * Builds a Zod schema for a template's options. Unknown keys are stripped and invalid
 * values fall back to the option default, so stale design configs never break rendering.
 */
export function optionsToZod(options: readonly TemplateOption[]) {
  const shape: Record<string, z.ZodType> = {};
  for (const opt of options) {
    shape[opt.key] =
      opt.type === "boolean"
        ? z.boolean().catch(opt.default)
        : z.enum(opt.choices.map((c) => c.value) as [string, ...string[]]).catch(opt.default);
  }
  return z.object(shape);
}

export function defaultOptions(options: readonly TemplateOption[]): Record<string, unknown> {
  return Object.fromEntries(options.map((o) => [o.key, o.default]));
}

export function findPalette(manifest: TemplateManifest, id: string | undefined): Palette {
  return manifest.palettes.find((p) => p.id === id) ?? manifest.palettes[0];
}

export function findFontPair(manifest: TemplateManifest, id: string | undefined): FontPair {
  return manifest.fontPairs.find((f) => f.id === id) ?? manifest.fontPairs[0];
}

/** Validates a manifest's internal consistency (used by the template contract test). */
export function assertValidManifest(m: TemplateManifest): void {
  const problems: string[] = [];
  if (!/^[a-z0-9-]+$/.test(m.slug)) problems.push("slug must be kebab-case");
  for (const r of REQUIRED_SECTIONS)
    if (!m.supportedSections.includes(r)) problems.push(`must support "${r}"`);
  for (const s of m.defaultSections)
    if (!m.supportedSections.includes(s)) problems.push(`default section "${s}" not supported`);
  if (m.palettes.length < 1) problems.push("needs at least one palette");
  if (m.fontPairs.length < 1) problems.push("needs at least one font pair");
  if (new Set(m.options.map((o) => o.key)).size !== m.options.length)
    problems.push("duplicate option keys");
  for (const o of m.options)
    if (o.type === "select" && !o.choices.some((c) => c.value === o.default))
      problems.push(`option "${o.key}" default not in choices`);
  if (problems.length) throw new Error(`Invalid manifest "${m.slug}": ${problems.join("; ")}`);
}
