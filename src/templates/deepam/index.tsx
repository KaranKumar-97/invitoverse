"use client";

import { InvitationRenderer } from "@/invitation-kit/InvitationRenderer";
import type { RenderableInvitation, TemplateModule } from "@/invitation-kit/types";
import { DeepamEnvelope } from "./Envelope";
import { deepamFonts } from "./fonts";
import { DeepamLayout } from "./Layout";
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

export const deepamModule: TemplateModule = {
  Envelope: DeepamEnvelope,
  Layout: DeepamLayout,
  fonts: deepamFonts,
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

export default function Deepam({ data }: { data: RenderableInvitation }) {
  return <InvitationRenderer data={data} module={deepamModule} />;
}
