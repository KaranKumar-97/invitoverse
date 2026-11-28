"use client";

import { InvitationRenderer } from "@/invitation-kit/InvitationRenderer";
import type { RenderableInvitation, TemplateModule } from "@/invitation-kit/types";
import { DeepotsavEnvelope } from "./Envelope";
import { deepotsavFonts } from "./fonts";
import { DeepotsavLayout } from "./Layout";
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

export const deepotsavModule: TemplateModule = {
  Envelope: DeepotsavEnvelope,
  Layout: DeepotsavLayout,
  fonts: deepotsavFonts,
  sections: {
    hero: Hero,
    greeting: Greeting,
    couple: Couple,
    message: Message,
    gallery: GallerySection,
    events: Events,
    countdown: Countdown,
    families: Families,
    video: Video,
    footer: Footer,
  },
};

export default function Deepotsav({ data }: { data: RenderableInvitation }) {
  return <InvitationRenderer data={data} module={deepotsavModule} />;
}
