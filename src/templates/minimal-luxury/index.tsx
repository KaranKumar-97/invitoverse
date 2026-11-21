"use client";

import { InvitationRenderer } from "@/invitation-kit/InvitationRenderer";
import type { RenderableInvitation, TemplateModule } from "@/invitation-kit/types";
import { MinimalEnvelope } from "./Envelope";
import { minimalFonts } from "./fonts";
import { MinimalLayout } from "./Layout";
import {
  Couple,
  Countdown,
  Events,
  Families,
  Footer,
  GallerySection,
  Greeting,
  Hero,
  Message,
  Video,
} from "./sections";
import "./styles.css";

export const minimalLuxuryModule: TemplateModule = {
  Envelope: MinimalEnvelope,
  Layout: MinimalLayout,
  fonts: minimalFonts,
  sections: {
    hero: Hero,
    greeting: Greeting,
    couple: Couple,
    families: Families,
    countdown: Countdown,
    events: Events,
    gallery: GallerySection,
    video: Video,
    message: Message,
    footer: Footer,
  },
};

export default function MinimalLuxury({ data }: { data: RenderableInvitation }) {
  return <InvitationRenderer data={data} module={minimalLuxuryModule} />;
}
