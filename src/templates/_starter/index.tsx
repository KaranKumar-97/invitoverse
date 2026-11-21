"use client";

import { useAnimate } from "motion/react-mini";
import { coupleTitle, monogram } from "@/lib/invitation/couple";
import { formatLongDate, formatTimeRange } from "@/lib/invitation/dates";
import { useCountdown } from "@/invitation-kit/countdown/useCountdown";
import { EventActions } from "@/invitation-kit/events/EventActions";
import { InvitationRenderer } from "@/invitation-kit/InvitationRenderer";
import { Reveal } from "@/invitation-kit/motion/Reveal";
import type {
  EnvelopeProps,
  RenderableInvitation,
  SectionProps,
  TemplateModule,
} from "@/invitation-kit/types";
import { starterFonts } from "./fonts";

function Envelope({ data, reducedMotion, onOpenStart, onReveal, onOpened }: EnvelopeProps) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const open = async () => {
    onOpenStart();
    onReveal();
    try {
      await animate(
        scope.current,
        { opacity: 0 },
        { duration: reducedMotion ? 0.2 : data.durationMs / 1000 },
      );
    } catch {
      /* interrupted */
    }
    onOpened();
  };
  return (
    <div
      ref={scope}
      className="flex h-full flex-col items-center justify-center gap-6 text-center"
      style={{ background: "var(--c-bg)" }}
    >
      {data.guest && <p>For {data.guest.displayName}</p>}
      {Boolean(data.options.showMonogram) && (
        <p className="f-display text-4xl">{monogram(data.content.couple)}</p>
      )}
      <button
        type="button"
        onClick={open}
        className="rounded-full px-6 py-3"
        style={{ background: "var(--c-accent)", color: "var(--c-accent-contrast)" }}
      >
        Open Invitation
      </button>
    </div>
  );
}

const Hero = ({ data }: SectionProps) => (
  <section className="flex min-h-dvh flex-col items-center justify-center text-center">
    <h1 id="invite-title" tabIndex={-1} className="f-display text-5xl outline-none">
      {coupleTitle(data.content.couple)}
    </h1>
    <p className="mt-4">{formatLongDate(data.content.weddingDate)}</p>
  </section>
);

const Greeting = ({ data }: SectionProps) => (
  <Reveal as="section" className="px-6 py-16 text-center">
    {data.guest && (
      <p className="f-heading text-2xl">
        {data.guest.greeting || `Dear ${data.guest.displayName},`}
      </p>
    )}
    <p className="mt-3">{data.content.messages.welcome}</p>
  </Reveal>
);

const Countdown = ({ data }: SectionProps) => {
  const v = useCountdown(data.countdownTo);
  return <p className="py-10 text-center">{v ? `${v.days} days to go` : "–"}</p>;
};

const Events = ({ data }: SectionProps) => (
  <section className="px-6 py-16">
    <ul className="mx-auto max-w-md space-y-8">
      {data.content.events.map((e) => (
        <li key={e.id}>
          <h3 className="f-heading text-xl">{e.name}</h3>
          <p>
            {formatLongDate(e.date)} · {formatTimeRange(e.startTime, e.endTime)}
          </p>
          <p>{e.venue.name}</p>
          <EventActions event={e} className="mt-2" buttonClassName="underline" />
        </li>
      ))}
    </ul>
  </section>
);

const Footer = ({ data }: SectionProps) => (
  <footer className="py-16 text-center">{data.content.messages.closing ?? "With love"}</footer>
);

export const starterModule: TemplateModule = {
  Envelope,
  fonts: starterFonts,
  sections: {
    hero: Hero,
    greeting: Greeting,
    countdown: Countdown,
    events: Events,
    footer: Footer,
  },
};

export default function Starter({ data }: { data: RenderableInvitation }) {
  return <InvitationRenderer data={data} module={starterModule} />;
}
