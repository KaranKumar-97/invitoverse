import { Noto_Sans_Gurmukhi, Noto_Serif_Devanagari } from "next/font/google";

// Indic script fallbacks (docs/01-prd.md NFR-13). Not preloaded: the browser only downloads
// them when the page contains Devanagari / Gurmukhi characters (unicode-range subsets).
const devanagari = Noto_Serif_Devanagari({
  subsets: ["devanagari"],
  // Variable font (no fixed weights): fixed-weight requests come back as dynamic subset URLs
  // that next/font cannot self-host in production builds.
  variable: "--font-indic-deva",
  preload: false,
  display: "swap",
});
const gurmukhi = Noto_Sans_Gurmukhi({
  subsets: ["gurmukhi"],
  variable: "--font-indic-guru",
  preload: false,
  display: "swap",
});

export const indicFontsClassName = `${devanagari.variable} ${gurmukhi.variable}`;
export const INDIC_FALLBACK = "var(--font-indic-deva), var(--font-indic-guru)";
