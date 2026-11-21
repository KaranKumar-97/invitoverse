"use client";

import { createContext, useContext } from "react";
import type { RenderableInvitation } from "@/lib/invitation/resolve";

export type InvitationPhase = "closed" | "opening" | "revealing" | "open";

type Ctx = {
  data: RenderableInvitation;
  phase: InvitationPhase;
  /** True once content may animate in (revealing or open). */
  revealed: boolean;
  reducedMotion: boolean;
  /** 0.6 / 1 / 1.4 from animation intensity (0 under reduced motion). */
  scale: number;
};

const InvitationContext = createContext<Ctx | null>(null);
export const InvitationProvider = InvitationContext.Provider;

export function useInvitation(): Ctx {
  const ctx = useContext(InvitationContext);
  if (!ctx) throw new Error("useInvitation must be used inside <InvitationRenderer>");
  return ctx;
}
