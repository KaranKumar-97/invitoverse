/**
 * Template registry (docs/05-template-engine.md §6).
 * Adding a template = one folder in src/templates/<slug> + one line here + one line in components.ts.
 * Manifests and demo data are plain objects (no React) and safe to import anywhere.
 */
import type { TemplateManifest } from "@/lib/invitation/manifest";
import type { DesignConfigInput, InvitationContentInput } from "@/lib/invitation/schema";
import { royalHeritageDemo } from "./royal-heritage/demo";
import { royalHeritageManifest } from "./royal-heritage/manifest";
import { minimalLuxuryDemo } from "./minimal-luxury/demo";
import { minimalLuxuryManifest } from "./minimal-luxury/manifest";
import { deepamDemo } from "./deepam/demo";
import { deepamManifest } from "./deepam/manifest";
import { meenakshiDemo } from "./meenakshi/demo";
import { meenakshiManifest } from "./meenakshi/manifest";
import { mandirDemo } from "./mandir/demo";
import { mandirManifest } from "./mandir/manifest";
import { kashiDemo } from "./kashi/demo";
import { kashiManifest } from "./kashi/manifest";

export type TemplateDemo = {
  content: InvitationContentInput;
  design: Partial<DesignConfigInput>;
  /** Events the demo "Sharma Family" guest is invited to. */
  guestEventIds: string[];
};

export const templateManifests = {
  "royal-heritage": royalHeritageManifest,
  "minimal-luxury": minimalLuxuryManifest,
  deepam: deepamManifest,
  meenakshi: meenakshiManifest,
  mandir: mandirManifest,
  kashi: kashiManifest,
} as const satisfies Record<string, TemplateManifest>;

export type TemplateSlug = keyof typeof templateManifests;

export const templateDemos: Record<TemplateSlug, TemplateDemo> = {
  "royal-heritage": royalHeritageDemo,
  "minimal-luxury": minimalLuxuryDemo,
  deepam: deepamDemo,
  meenakshi: meenakshiDemo,
  mandir: mandirDemo,
  kashi: kashiDemo,
};

export const TEMPLATE_SLUGS = Object.keys(templateManifests) as TemplateSlug[];

export function isTemplateSlug(value: string): value is TemplateSlug {
  return Object.hasOwn(templateManifests, value);
}

export function getManifest(slug: string): TemplateManifest | undefined {
  return isTemplateSlug(slug) ? templateManifests[slug] : undefined;
}
