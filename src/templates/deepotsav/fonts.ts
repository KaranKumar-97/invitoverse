import { Cinzel, Cormorant_Garamond, EB_Garamond, Pinyon_Script } from "next/font/google";
import type { FontStacks } from "@/invitation-kit/types";

// Static families need an explicit weight; variable ones (Cormorant Garamond, Cinzel,
// EB Garamond) must NOT get one (fixed-weight requests can break `next build`).
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-dp-cormorant",
  display: "swap",
});
const pinyon = Pinyon_Script({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-dp-pinyon",
  display: "swap",
});
// Alternate pair: not preloaded.
const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-dp-cinzel",
  display: "swap",
  preload: false,
});
const garamond = EB_Garamond({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-dp-garamond",
  display: "swap",
  preload: false,
});

export const deepotsavFonts: { className: string; stacks: Record<string, FontStacks> } = {
  className: [cormorant, pinyon, cinzel, garamond].map((f) => f.variable).join(" "),
  stacks: {
    "cormorant-pinyon": {
      display: "var(--font-dp-pinyon), cursive",
      heading: "var(--font-dp-cormorant), serif",
      body: "var(--font-dp-cormorant), serif",
      script: "var(--font-dp-pinyon), cursive",
    },
    "cinzel-garamond": {
      display: "var(--font-dp-cinzel), serif",
      heading: "var(--font-dp-cinzel), serif",
      body: "var(--font-dp-garamond), serif",
      script: "var(--font-dp-pinyon), cursive",
    },
  },
};
