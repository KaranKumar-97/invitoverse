"use client";

import { Fragment, useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { motionScale } from "@/lib/invitation/motion";
import { useMediaQuery } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { InvitationProvider, type InvitationPhase } from "./context";
import { indicFontsClassName, INDIC_FALLBACK } from "./fonts";
import { MusicToggle } from "./music/MusicToggle";
import { musicPreferenceOff, useMusicController } from "./music/useMusicController";
import { ScrollHint } from "./ScrollHint";
import { SectionBoundary } from "./SectionBoundary";
import type { RenderableInvitation, TemplateModule } from "./types";
import "./kit.css";

const OPENED_KEY = (key: string) => `vs:opened:${key}`;
const COUNTED_KEY = (key: string) => `vs:counted:${key}`;

/** One count per browser session, sent on the guest's Open tap (crawlers never tap). */
function sendOpenBeacon(data: RenderableInvitation) {
  const b = data.links.beacon;
  if (!b) return;
  try {
    if (sessionStorage.getItem(COUNTED_KEY(data.key))) return;
    sessionStorage.setItem(COUNTED_KEY(data.key), "1");
  } catch {
    /* storage unavailable: still count */
  }
  const body = new Blob([JSON.stringify(b)], { type: "application/json" });
  if (!navigator.sendBeacon?.("/api/v1/beacon/open", body)) {
    void fetch("/api/v1/beacon/open", {
      method: "POST",
      body,
      keepalive: true,
      headers: { "Content-Type": "application/json" },
    }).catch(() => {});
  }
}

function themeVars(data: RenderableInvitation, module: TemplateModule): CSSProperties {
  const c = data.theme.colors;
  const f = module.fonts.stacks[data.theme.fontPairId] ?? Object.values(module.fonts.stacks)[0];
  const withIndic = (stack: string) =>
    `${stack.replace(/,\s*(serif|sans-serif|cursive)\s*$/, "")}, ${INDIC_FALLBACK}, serif`;
  return {
    "--c-bg": c.bg,
    "--c-surface": c.surface,
    "--c-text": c.text,
    "--c-muted": c.muted,
    "--c-accent": c.accent,
    "--c-accent-contrast": c.accentContrast,
    "--f-display": withIndic(f.display),
    "--f-heading": withIndic(f.heading),
    "--f-body": withIndic(f.body),
    "--f-script": withIndic(f.script),
    "--motion-scale": String(motionScale(data.animation.intensity)),
    "--inv-bg-image": data.theme.background.src ? `url("${data.theme.background.src}")` : "none",
  } as CSSProperties;
}

/**
 * The one renderer used by template demos, the editor preview and live invitations.
 * Owns: phases (envelope → reveal → open), theme variables, music, scroll lock, focus, skip.
 * Templates own: look and choreography.
 */
export function InvitationRenderer({
  data,
  module,
}: {
  data: RenderableInvitation;
  module: TemplateModule;
}) {
  const prefersReduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [phase, setPhase] = useState<InvitationPhase>(data.animation.envelope ? "closed" : "open");
  const [seenBefore, setSeenBefore] = useState(false);
  const music = useMusicController(data.music);
  const Layout = module.Layout ?? Fragment;
  const Envelope = module.Envelope;

  useEffect(() => {
    try {
      setSeenBefore(sessionStorage.getItem(OPENED_KEY(data.key)) === "1");
    } catch {
      /* storage unavailable */
    }
  }, [data.key]);

  // Lock page scroll while the envelope is showing.
  useEffect(() => {
    if (phase === "open") return;
    const el = document.documentElement;
    const prev = el.style.overflow;
    el.style.overflow = "hidden";
    return () => {
      el.style.overflow = prev;
    };
  }, [phase]);

  // Without an envelope there's no tap; count once the page is actually shown.
  useEffect(() => {
    if (!data.animation.envelope) sendOpenBeacon(data);
  }, [data]);

  const onOpenStart = useCallback(() => {
    sendOpenBeacon(data);
    setPhase("opening");
    if (data.animation.autoplayMusic && !musicPreferenceOff()) music.play();
  }, [data, music]);

  const onReveal = useCallback(() => setPhase((p) => (p === "open" ? p : "revealing")), []);

  const onOpened = useCallback(() => {
    setPhase("open");
    try {
      sessionStorage.setItem(OPENED_KEY(data.key), "1");
    } catch {
      /* ignore */
    }
    requestAnimationFrame(() =>
      document.getElementById("invite-title")?.focus({ preventScroll: true }),
    );
  }, [data.key]);

  const skip = useCallback(() => {
    if (phase === "closed") onOpenStart();
    onOpened();
  }, [phase, onOpenStart, onOpened]);

  const ctx = useMemo(
    () => ({
      data,
      phase,
      revealed: phase === "revealing" || phase === "open",
      reducedMotion: prefersReduced,
      scale: prefersReduced ? 0 : motionScale(data.animation.intensity),
    }),
    [data, phase, prefersReduced],
  );

  const contentHidden = phase === "closed" || phase === "opening";

  return (
    <InvitationProvider value={ctx}>
      <div
        className={cn("inv-root relative", module.fonts.className, indicFontsClassName)}
        style={themeVars(data, module)}
        data-template={data.templateSlug}
        data-phase={phase}
      >
        <div aria-hidden={contentHidden || undefined} inert={contentHidden || undefined}>
          <Layout data={data}>
            {data.sections.map((key, index) => {
              const Section = module.sections[key];
              return Section ? (
                <SectionBoundary key={key} section={key}>
                  <Section data={data} index={index} />
                </SectionBoundary>
              ) : null;
            })}
          </Layout>
        </div>

        {phase !== "open" && (
          <div className="fixed inset-0 z-50" data-envelope>
            <Envelope
              data={data}
              reducedMotion={prefersReduced}
              onOpenStart={onOpenStart}
              onReveal={onReveal}
              onOpened={onOpened}
            />
            {(phase !== "closed" || seenBefore) && (
              <button
                type="button"
                onClick={skip}
                className="absolute right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-10 rounded-full px-4 py-2 text-xs tracking-[0.2em] uppercase opacity-70 transition-opacity hover:opacity-100"
                style={{
                  color: "var(--c-text)",
                  background: "color-mix(in srgb, var(--c-bg) 55%, transparent)",
                }}
              >
                Skip intro
              </button>
            )}
          </div>
        )}

        <MusicToggle music={music} visible={phase === "open"} />
        {module.scrollHint !== false && (
          <ScrollHint active={phase === "open"} reducedMotion={prefersReduced} />
        )}
      </div>
    </InvitationProvider>
  );
}
