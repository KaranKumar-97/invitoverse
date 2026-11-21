/**
 * Code-split template entry points. Each template's React code is only downloaded on pages that
 * render it. Server components render these directly; they SSR as client components.
 */
import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { RenderableInvitation } from "@/invitation-kit/types";
import type { TemplateSlug } from "./registry";

type TemplateComponent = ComponentType<{ data: RenderableInvitation }>;

export const templateComponents: Record<TemplateSlug, TemplateComponent> = {
  "royal-heritage": dynamic(() => import("./royal-heritage")),
  "minimal-luxury": dynamic(() => import("./minimal-luxury")),
};
