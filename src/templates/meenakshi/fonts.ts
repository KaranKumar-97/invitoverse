import {
  Cinzel_Decorative,
  Cormorant_Garamond,
  EB_Garamond,
  Marcellus,
  Pinyon_Script,
} from "next/font/google";
import type { FontStacks } from "@/invitation-kit/types";

// Static families need an explicit weight; variable ones (Cormorant Garamond, EB Garamond) must NOT
// get one (fixed-weight requests can break `next build` — see CLAUDE.md).
const cinzel = Cinzel_Decorative({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mk-cinzel",
  display: "swap",
});
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-mk-cormorant",
  display: "swap",
});
const marcellus = Marcellus({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-mk-marcellus",
  display: "swap",
});
const pinyon = Pinyon_Script({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-mk-pinyon",
  display: "swap",
});
// Alternate pair: not preloaded.
const garamond = EB_Garamond({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-mk-garamond",
  display: "swap",
  preload: false,
});

export const meenakshiFonts: { className: string; stacks: Record<string, FontStacks> } = {
  className: [cinzel, cormorant, marcellus, pinyon, garamond].map((f) => f.variable).join(" "),
  stacks: {
    "cinzel-cormorant": {
      display: "var(--font-mk-cinzel), serif",
      heading: "var(--font-mk-marcellus), serif",
      body: "var(--font-mk-cormorant), serif",
      script: "var(--font-mk-pinyon), cursive",
    },
    "marcellus-garamond": {
      display: "var(--font-mk-marcellus), serif",
      heading: "var(--font-mk-marcellus), serif",
      body: "var(--font-mk-garamond), serif",
      script: "var(--font-mk-pinyon), cursive",
    },
  },
};
