import { EB_Garamond, Lora, Marcellus, Parisienne, Rozha_One } from "next/font/google";
import type { FontStacks } from "@/invitation-kit/types";

// Static families need an explicit weight; variable ones (EB Garamond, Lora) must NOT get one
// (fixed-weight requests can return URLs next/font can't parse — see CLAUDE.md).
const marcellus = Marcellus({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-dp-marcellus",
  display: "swap",
});
const garamond = EB_Garamond({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-dp-garamond",
  display: "swap",
});
const parisienne = Parisienne({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-dp-parisienne",
  display: "swap",
});
// Alternate pair: not preloaded.
const rozha = Rozha_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-dp-rozha",
  display: "swap",
  preload: false,
});
const lora = Lora({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-dp-lora",
  display: "swap",
  preload: false,
});

export const deepamFonts: { className: string; stacks: Record<string, FontStacks> } = {
  className: [marcellus, garamond, parisienne, rozha, lora].map((f) => f.variable).join(" "),
  stacks: {
    "marcellus-garamond": {
      display: "var(--font-dp-marcellus), serif",
      heading: "var(--font-dp-marcellus), serif",
      body: "var(--font-dp-garamond), serif",
      script: "var(--font-dp-parisienne), cursive",
    },
    "rozha-lora": {
      display: "var(--font-dp-rozha), serif",
      heading: "var(--font-dp-rozha), serif",
      body: "var(--font-dp-lora), serif",
      script: "var(--font-dp-parisienne), cursive",
    },
  },
};
