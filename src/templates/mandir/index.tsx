"use client";

import { InvitationRenderer } from "@/invitation-kit/InvitationRenderer";
import type { RenderableInvitation, TemplateModule } from "@/invitation-kit/types";
import { MandirEnvelope } from "./Envelope";
import { mandirFonts } from "./fonts";
import { MandirLayout } from "./Layout";
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

export const mandirModule: TemplateModule = {
  Envelope: MandirEnvelope,
  Layout: MandirLayout,
  fonts: mandirFonts,
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

export default function Mandir({ data }: { data: RenderableInvitation }) {
  return <InvitationRenderer data={data} module={mandirModule} />;
}
