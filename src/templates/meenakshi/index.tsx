"use client";

import { InvitationRenderer } from "@/invitation-kit/InvitationRenderer";
import type { RenderableInvitation, TemplateModule } from "@/invitation-kit/types";
import { MeenakshiEnvelope } from "./Envelope";
import { meenakshiFonts } from "./fonts";
import { MeenakshiLayout } from "./Layout";
import {
  Countdown,
  Couple,
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

export const meenakshiModule: TemplateModule = {
  Envelope: MeenakshiEnvelope,
  Layout: MeenakshiLayout,
  fonts: meenakshiFonts,
  sections: {
    hero: Hero,
    families: Families,
    greeting: Greeting,
    couple: Couple,
    events: Events,
    countdown: Countdown,
    gallery: GallerySection,
    video: Video,
    message: Message,
    footer: Footer,
  },
};

export default function Meenakshi({ data }: { data: RenderableInvitation }) {
  return <InvitationRenderer data={data} module={meenakshiModule} />;
}
