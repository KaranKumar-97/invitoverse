"use client";

import { InvitationRenderer } from "@/invitation-kit/InvitationRenderer";
import type { RenderableInvitation, TemplateModule } from "@/invitation-kit/types";
import { RoyalEnvelope } from "./Envelope";
import { royalFonts } from "./fonts";
import { RoyalLayout } from "./Layout";
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

export const royalHeritageModule: TemplateModule = {
  Envelope: RoyalEnvelope,
  Layout: RoyalLayout,
  fonts: royalFonts,
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

export default function RoyalHeritage({ data }: { data: RenderableInvitation }) {
  return <InvitationRenderer data={data} module={royalHeritageModule} />;
}
