import {
  Bodoni_Moda,
  Cormorant,
  Italiana,
  Jost,
  Libre_Caslon_Text,
  Manrope,
} from "next/font/google";
import type { FontStacks } from "@/invitation-kit/types";

const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-ml-bodoni",
  display: "swap",
});
const cormorant = Cormorant({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-ml-cormorant",
  display: "swap",
});
const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-ml-jost",
  display: "swap",
});
const italiana = Italiana({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-ml-italiana",
  display: "swap",
  preload: false,
});
const caslon = Libre_Caslon_Text({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-ml-caslon",
  display: "swap",
  preload: false,
});
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-ml-manrope",
  display: "swap",
  preload: false,
});

export const minimalFonts: { className: string; stacks: Record<string, FontStacks> } = {
  className: [bodoni, cormorant, jost, italiana, caslon, manrope].map((f) => f.variable).join(" "),
  stacks: {
    "bodoni-jost": {
      display: "var(--font-ml-bodoni), serif",
      heading: "var(--font-ml-cormorant), serif",
      body: "var(--font-ml-jost), sans-serif",
      script: "var(--font-ml-bodoni), serif",
    },
    "italiana-caslon": {
      display: "var(--font-ml-italiana), serif",
      heading: "var(--font-ml-caslon), serif",
      body: "var(--font-ml-manrope), sans-serif",
      script: "var(--font-ml-caslon), serif",
    },
  },
};
