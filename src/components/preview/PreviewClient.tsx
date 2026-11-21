"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { resolveRenderable, type RenderableInvitation } from "@/lib/invitation/resolve";
import type { DesignConfig, DraftContent, SectionKey } from "@/lib/invitation/schema";
import { readEditorMessage, wrap, type PreviewToEditor } from "@/lib/preview/messages";
import { templateComponents } from "@/templates/components";
import { templateManifests, type TemplateSlug } from "@/templates/registry";

/**
 * Renders a draft inside the editor's iframe and re-renders on every `draft:update`
 * message — no network round trip (docs/02-architecture.md §4).
 */
export function PreviewClient({
  templateSlug,
  invitationKey,
  initialContent,
  initialDesign,
}: {
  templateSlug: TemplateSlug;
  invitationKey: string;
  initialContent: DraftContent;
  initialDesign: DesignConfig;
}) {
  const manifest = templateManifests[templateSlug];
  const Template = templateComponents[templateSlug];
  const [draft, setDraft] = useState({ content: initialContent, design: initialDesign });
  const [mount, setMount] = useState({ nonce: 0, skipIntro: false });
  const pendingScroll = useRef<SectionKey | null>(null);
  const lastGood = useRef<RenderableInvitation | null>(null);

  const data = useMemo(() => {
    try {
      const resolved = resolveRenderable({
        manifest,
        content: draft.content,
        design: draft.design,
        mode: "PREVIEW",
        key: invitationKey,
      });
      lastGood.current = resolved;
      return resolved;
    } catch (e) {
      post({ type: "preview:error", message: e instanceof Error ? e.message : "Preview failed" });
      return lastGood.current;
    }
  }, [manifest, draft, invitationKey]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const msg = readEditorMessage(e);
      if (!msg) return;
      if (msg.type === "draft:update") setDraft({ content: msg.content, design: msg.design });
      if (msg.type === "preview:replayIntro")
        setMount((m) => ({ nonce: m.nonce + 1, skipIntro: false }));
      if (msg.type === "preview:scrollTo") {
        const phase = document.querySelector<HTMLElement>("[data-phase]")?.dataset.phase;
        if (phase === "open") scrollToSection(msg.section);
        else {
          // Jump past the envelope so the edited section is visible.
          pendingScroll.current = msg.section;
          setMount((m) => ({ nonce: m.nonce + 1, skipIntro: true }));
        }
      }
    };
    window.addEventListener("message", onMessage);
    post({ type: "preview:ready" });
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (!pendingScroll.current) return;
    const section = pendingScroll.current;
    pendingScroll.current = null;
    requestAnimationFrame(() => scrollToSection(section, "auto"));
  }, [mount]);

  if (!data) return null;
  const shown = mount.skipIntro
    ? { ...data, animation: { ...data.animation, envelope: false } }
    : data;
  return <Template key={mount.nonce} data={shown} />;
}

function post(msg: PreviewToEditor) {
  if (window.parent !== window) window.parent.postMessage(wrap(msg), window.location.origin);
}

function scrollToSection(section: SectionKey, behavior: ScrollBehavior = "smooth") {
  document.getElementById(`section-${section}`)?.scrollIntoView({ behavior, block: "start" });
}
