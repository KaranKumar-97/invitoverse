import type { FontStacks } from "@/invitation-kit/types";

// Real templates load fonts with next/font/google and reference their CSS variables here.
export const starterFonts: { className: string; stacks: Record<string, FontStacks> } = {
  className: "",
  stacks: {
    system: {
      display: "Georgia, serif",
      heading: "Georgia, serif",
      body: "system-ui, sans-serif",
      script: "Georgia, serif",
    },
  },
};
