import type { ComponentType, ReactNode } from "react";
import type { RenderableInvitation } from "@/lib/invitation/resolve";
import type { SectionKey } from "@/lib/invitation/schema";

export type { RenderableInvitation };

export type EnvelopeProps = {
  data: RenderableInvitation;
  reducedMotion: boolean;
  /** Call synchronously inside the tap handler (starts music within the user gesture). */
  onOpenStart: () => void;
  /** Call when the invitation content should start revealing underneath. Optional. */
  onReveal: () => void;
  /** Call when the opening sequence has finished; the overlay is then removed. */
  onOpened: () => void;
};

export type SectionProps = { data: RenderableInvitation; index: number };

/** CSS font-family values (usually `var(--font-x), fallback`) per font pair id. */
export type FontStacks = { display: string; heading: string; body: string; script: string };

export type TemplateModule = {
  Envelope: ComponentType<EnvelopeProps>;
  sections: Partial<Record<SectionKey, ComponentType<SectionProps>>>;
  /** Page frame / ambient decor around the sections. */
  Layout?: ComponentType<{ data: RenderableInvitation; children: ReactNode }>;
  fonts: { className: string; stacks: Record<string, FontStacks> };
  /** Show the floating "Scroll to explore" hint after opening (default true). */
  scrollHint?: boolean;
};
