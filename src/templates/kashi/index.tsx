"use client";

import { InvitationRenderer } from "@/invitation-kit/InvitationRenderer";
import type { RenderableInvitation, TemplateModule } from "@/invitation-kit/types";
import { KashiEnvelope } from "./Envelope";
import { kashiFonts } from "./fonts";
import { KashiLayout } from "./Layout";
import {
  Couple,
  Countdown,
  Events,
  Families,
  Footer,
  GallerySection,
  Greeting,
  Hero,
  Video,
} from "./sections";
import "./styles.css";

export const kashiModule: TemplateModule = {
  Envelope: KashiEnvelope,
  Layout: KashiLayout,
  fonts: kashiFonts,
  sections: {
    hero: Hero,
    greeting: Greeting,
    couple: Couple,
    families: Families,
    countdown: Countdown,
    events: Events,
    gallery: GallerySection,
    video: Video,
    footer: Footer,
  },
};

export default function Kashi({ data }: { data: RenderableInvitation }) {
  return <InvitationRenderer data={data} module={kashiModule} />;
}
