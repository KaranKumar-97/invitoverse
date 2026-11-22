import {
  Bodoni_Moda,
  Cormorant_Garamond,
  EB_Garamond,
  Marcellus,
  Pinyon_Script,
} from "next/font/google";
import type { FontStacks } from "@/invitation-kit/types";

// Static families need an explicit weight; variable ones (Bodoni Moda, Cormorant Garamond,
// EB Garamond) must NOT get one (fixed-weight requests can break `next build` — see CLAUDE.md).
const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-md-bodoni",
  display: "swap",
});
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-md-cormorant",
  display: "swap",
});
const pinyon = Pinyon_Script({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-md-pinyon",
  display: "swap",
});
// Alternate pair: not preloaded.
const marcellus = Marcellus({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-md-marcellus",
  display: "swap",
  preload: false,
});
const garamond = EB_Garamond({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-md-garamond",
  display: "swap",
  preload: false,
});

export const mandirFonts: { className: string; stacks: Record<string, FontStacks> } = {
  className: [bodoni, cormorant, pinyon, marcellus, garamond].map((f) => f.variable).join(" "),
  stacks: {
    "bodoni-cormorant": {
      display: "var(--font-md-bodoni), serif",
      heading: "var(--font-md-bodoni), serif",
      body: "var(--font-md-cormorant), serif",
      script: "var(--font-md-pinyon), cursive",
    },
    "marcellus-garamond": {
      display: "var(--font-md-marcellus), serif",
      heading: "var(--font-md-marcellus), serif",
      body: "var(--font-md-garamond), serif",
      script: "var(--font-md-pinyon), cursive",
    },
  },
};
