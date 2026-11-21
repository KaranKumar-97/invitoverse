import type { TemplateManifest } from "@/lib/invitation/manifest";

export const minimalLuxuryManifest = {
  slug: "minimal-luxury",
  name: "Minimal Luxury",
  version: 1,
  category: "MINIMAL",
  tagline: "Ivory linen, black ink and quiet elegance.",
  description:
    "Letterpress restraint — generous whitespace, a blind-embossed monogram and fine hairlines. The card slides out of a linen envelope and unfolds into your invitation.",
  styleLabel: "Minimal · Ivory & Ink",
  supportedSections: [
    "hero",
    "greeting",
    "couple",
    "families",
    "countdown",
    "events",
    "gallery",
    "video",
    "message",
    "footer",
  ],
  defaultSections: [
    "hero",
    "greeting",
    "families",
    "events",
    "countdown",
    "couple",
    "gallery",
    "message",
    "footer",
  ],
  palettes: [
    {
      id: "ivory-ink",
      name: "Ivory & Ink",
      colors: {
        bg: "#F7F3EC",
        surface: "#FFFDF9",
        text: "#1E1B18",
        muted: "#6F675E", // AA 5.0:1 on bg
        accent: "#977849", // ≥3:1 for large script text
        accentContrast: "#FFFFFF",
      },
    },
    {
      id: "champagne-espresso",
      name: "Champagne & Espresso",
      colors: {
        bg: "#241C17",
        surface: "#2E241E",
        text: "#F3E9DC",
        muted: "#B5A492",
        accent: "#D4B483",
        accentContrast: "#241C17",
      },
    },
    {
      id: "sage-stone",
      name: "Sage & Stone",
      colors: {
        bg: "#EDEFE8",
        surface: "#F8F9F4",
        text: "#2B312A",
        muted: "#5F685A", // AA 5.0:1 on bg
        accent: "#6E7E62", // ≥3:1 for large script text
        accentContrast: "#FFFFFF",
      },
    },
  ],
  customizablePaletteKeys: ["accent", "bg", "text"],
  fontPairs: [
    {
      id: "bodoni-jost",
      name: "Bodoni & Jost",
      display: "Bodoni Moda",
      heading: "Cormorant",
      body: "Jost",
      script: "Bodoni Moda Italic",
    },
    {
      id: "italiana-caslon",
      name: "Italiana & Caslon",
      display: "Italiana",
      heading: "Libre Caslon Text",
      body: "Manrope",
      script: "Libre Caslon Italic",
    },
  ],
  backgrounds: [
    { id: "linen", name: "Linen", src: null },
    { id: "plain", name: "Plain", src: null },
  ],
  allowCustomBackground: false,
  animation: {
    intro: "card-slide",
    sectionReveal: "quiet-fade",
    particles: null,
    durationsMs: { SUBTLE: 1400, STANDARD: 2500, DRAMATIC: 3500 },
  },
  options: [
    {
      key: "monogramStyle",
      type: "select",
      label: "Monogram style",
      default: "serif",
      choices: [
        { value: "serif", label: "Serif" },
        { value: "italic", label: "Italic" },
      ],
    },
    { key: "paperTexture", type: "boolean", label: "Paper texture", default: true },
  ],
  media: { couplePhotos: { max: 1 }, gallery: { max: 16 }, video: true, music: true },
  defaultMusicTrackId: "ivory-waltz",
} as const satisfies TemplateManifest;
