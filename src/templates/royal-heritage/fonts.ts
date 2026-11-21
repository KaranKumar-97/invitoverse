import {
  Cinzel,
  Cinzel_Decorative,
  Cormorant_Garamond,
  Great_Vibes,
  Lora,
  Pinyon_Script,
  Playfair_Display,
  Playfair_Display_SC,
} from "next/font/google";
import type { FontStacks } from "@/invitation-kit/types";

const cinzelDeco = Cinzel_Decorative({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-rh-cinzel-deco",
  display: "swap",
});
const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-rh-cinzel",
  display: "swap",
});
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-rh-cormorant",
  display: "swap",
});
const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-rh-vibes",
  display: "swap",
});
// Alternate pair: not preloaded.
const playfairSc = Playfair_Display_SC({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-rh-playfair-sc",
  display: "swap",
  preload: false,
});
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-rh-playfair",
  display: "swap",
  preload: false,
});
// Variable font (no fixed weights): Google intermittently serves fixed-weight Lora via dynamic URLs
// that next/font can't self-host.
const lora = Lora({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-rh-lora",
  display: "swap",
  preload: false,
});
const pinyon = Pinyon_Script({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-rh-pinyon",
  display: "swap",
  preload: false,
});

export const royalFonts: { className: string; stacks: Record<string, FontStacks> } = {
  className: [cinzelDeco, cinzel, cormorant, greatVibes, playfairSc, playfair, lora, pinyon]
    .map((f) => f.variable)
    .join(" "),
  stacks: {
    "cinzel-cormorant": {
      display: "var(--font-rh-cinzel-deco), serif",
      heading: "var(--font-rh-cinzel), serif",
      body: "var(--font-rh-cormorant), serif",
      script: "var(--font-rh-vibes), cursive",
    },
    "playfair-lora": {
      display: "var(--font-rh-playfair-sc), serif",
      heading: "var(--font-rh-playfair), serif",
      body: "var(--font-rh-lora), serif",
      script: "var(--font-rh-pinyon), cursive",
    },
  },
};
