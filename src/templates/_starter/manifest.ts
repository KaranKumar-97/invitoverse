import type { TemplateManifest } from "@/lib/invitation/manifest";

export const starterManifest = {
  slug: "starter",
  name: "Starter",
  version: 1,
  category: "MINIMAL",
  tagline: "A bare skeleton to copy.",
  description: "Smallest valid template: required sections, one palette, system fonts.",
  styleLabel: "Starter",
  supportedSections: ["hero", "greeting", "countdown", "events", "footer"],
  defaultSections: ["hero", "greeting", "countdown", "events", "footer"],
  palettes: [
    {
      id: "default",
      name: "Default",
      colors: {
        bg: "#FFFFFF",
        surface: "#F5F5F4",
        text: "#1C1917",
        muted: "#78716C",
        accent: "#9F1239",
        accentContrast: "#FFFFFF",
      },
    },
  ],
  customizablePaletteKeys: ["accent"],
  fontPairs: [
    {
      id: "system",
      name: "System",
      display: "Georgia",
      heading: "Georgia",
      body: "system-ui",
      script: "Georgia",
    },
  ],
  backgrounds: [{ id: "plain", name: "Plain", src: null }],
  allowCustomBackground: false,
  animation: {
    intro: "fade",
    sectionReveal: "fade",
    particles: null,
    durationsMs: { SUBTLE: 400, STANDARD: 700, DRAMATIC: 1000 },
  },
  options: [{ key: "showMonogram", type: "boolean", label: "Show monogram", default: true }],
  media: { couplePhotos: { max: 0 }, gallery: { max: 0 }, video: false, music: true },
  defaultMusicTrackId: "ivory-waltz",
} as const satisfies TemplateManifest;
