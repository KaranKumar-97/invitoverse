import {
  Cinzel,
  Cormorant_Garamond,
  EB_Garamond,
  Great_Vibes,
  Playfair_Display,
} from "next/font/google";
import type { FontStacks } from "@/invitation-kit/types";

// Static families need an explicit weight; variable ones (Playfair Display, Cormorant Garamond,
// Cinzel, EB Garamond) must NOT get one (fixed-weight requests can break `next build`).
const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-ks-playfair",
  display: "swap",
});
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-ks-cormorant",
  display: "swap",
});
const vibes = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-ks-vibes",
  display: "swap",
});
// Alternate pair: not preloaded.
const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-ks-cinzel",
  display: "swap",
  preload: false,
});
const garamond = EB_Garamond({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-ks-garamond",
  display: "swap",
  preload: false,
});

export const kashiFonts: { className: string; stacks: Record<string, FontStacks> } = {
  className: [playfair, cormorant, vibes, cinzel, garamond].map((f) => f.variable).join(" "),
  stacks: {
    "playfair-cormorant": {
      display: "var(--font-ks-playfair), serif",
      heading: "var(--font-ks-playfair), serif",
      body: "var(--font-ks-cormorant), serif",
      script: "var(--font-ks-vibes), cursive",
    },
    "cinzel-garamond": {
      display: "var(--font-ks-cinzel), serif",
      heading: "var(--font-ks-cinzel), serif",
      body: "var(--font-ks-garamond), serif",
      script: "var(--font-ks-vibes), cursive",
    },
  },
};
