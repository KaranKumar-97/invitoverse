import { Fragment } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CATALOGUE } from "@/lib/marketing/catalogue";
import { SITE } from "@/lib/marketing/site";
import { LoopVideo } from "../LoopVideo";
import { PhoneFrame } from "../PhoneFrame";
import { TrackedLink } from "../TrackedLink";

/** Hero phones, in order: front-centre, left, right (mobile: first to last in the swipe row). */
const HERO_TEMPLATES = ["meenakshi", "mandir", "royal-heritage"] as const;

const WORDS = "Invitations that open like a love letter.".split(" ");
const FOIL = new Set(["love", "letter."]);

/** Home hero (docs/09 §3.1): staggered headline + floating phones playing real template openings. */
export function Hero() {
  const phones = HERO_TEMPLATES.flatMap((slug) => CATALOGUE.filter((t) => t.slug === slug));
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-48 right-[-12%] size-[48rem] rounded-full bg-[radial-gradient(closest-side,var(--glow),transparent)]"
      />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pt-10 pb-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-8 lg:px-8 lg:pt-16 lg:pb-24">
        <div className="min-w-0 text-center lg:text-left">
          <span className="mk-fade-up inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-ink-soft">
            <Sparkles className="size-3.5 text-gold" /> Digital wedding invitation studio
          </span>
          <h1 className="text-display-xl mt-6 text-balance">
            {WORDS.map((w, i) => (
              <Fragment key={i}>
                <span className="mk-word" style={{ "--i": i } as React.CSSProperties}>
                  {FOIL.has(w) ? <span className="text-foil">{w}</span> : w}
                </span>
                {i < WORDS.length - 1 && " "}
              </Fragment>
            ))}
          </h1>
          <p
            className="mk-fade-up mx-auto mt-6 max-w-xl text-lg text-pretty text-ink-soft lg:mx-0"
            style={{ "--delay": "420ms" } as React.CSSProperties}
          >
            Designer, animated invitation websites for every function — personalized for every
            guest, shared in one tap on WhatsApp.
          </p>
          <div
            className="mk-fade-up mt-9 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start"
            style={{ "--delay": "520ms" } as React.CSSProperties}
          >
            <Button asChild className="h-12 rounded-full px-7 text-base">
              <TrackedLink href="/templates" event="cta_choose_design" data={{ from: "hero" }}>
                Choose a design
              </TrackedLink>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 rounded-full bg-surface px-7 text-base"
            >
              <TrackedLink
                href={`/templates/${SITE.featuredDemo}/preview`}
                event="cta_live_invite"
                data={{ from: "hero" }}
              >
                See a live invite
              </TrackedLink>
            </Button>
          </div>
          <p
            className="mk-fade-up mt-6 text-sm text-muted-foreground"
            style={{ "--delay": "620ms" } as React.CSSProperties}
          >
            Free during beta · No app needed · Ready in minutes
          </p>
        </div>

        {/* Desktop: overlapping tilted phones. Mobile: swipeable row. */}
        <div className="relative min-w-0">
          <div className="-mx-4 flex snap-x snap-mandatory [scrollbar-width:none] gap-4 overflow-x-auto px-[19vw] pb-4 sm:px-[30vw] lg:hidden">
            {phones.map((t) => (
              <PhoneFrame key={t.slug} className="w-[62vw] max-w-[280px] shrink-0 snap-center">
                <LoopVideo
                  poster={t.media.poster}
                  mp4={t.media.mp4}
                  webm={t.media.webm}
                  label={`${t.name} invitation opening`}
                />
              </PhoneFrame>
            ))}
          </div>
          <div className="relative hidden h-[600px] lg:block">
            {phones.map((t, i) => {
              const layout = [
                { left: "34%", top: "0px", tilt: "-4deg", z: 3, w: 270, delay: "0ms" },
                { left: "2%", top: "70px", tilt: "-10deg", z: 2, w: 240, delay: "1200ms" },
                { left: "64%", top: "90px", tilt: "8deg", z: 1, w: 230, delay: "2400ms" },
              ][i]!;
              return (
                <div
                  key={t.slug}
                  className="absolute"
                  style={{ left: layout.left, top: layout.top, zIndex: layout.z, width: layout.w }}
                >
                  <PhoneFrame
                    className="mk-float"
                    style={
                      { "--tilt": layout.tilt, "--delay": layout.delay } as React.CSSProperties
                    }
                  >
                    <LoopVideo
                      poster={t.media.poster}
                      mp4={t.media.mp4}
                      webm={t.media.webm}
                      label={`${t.name} invitation opening`}
                      lazy={false}
                    />
                  </PhoneFrame>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
