/**
 * Template contract test (docs/05-template-engine.md §11).
 * Every registered template — plus the _starter skeleton — must render its demo data, a guest view,
 * every option value, and complete its opening sequence with and without reduced motion.
 */
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentType } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { defaultDesign } from "@/lib/invitation/defaults";
import {
  assertValidManifest,
  REQUIRED_SECTIONS,
  type TemplateManifest,
} from "@/lib/invitation/manifest";
import { resolveRenderable } from "@/lib/invitation/resolve";
import type { DesignConfig } from "@/lib/invitation/schema";
import type { RenderableInvitation } from "@/invitation-kit/types";
import { demoGuest } from "@/templates/demo-guest";
import { templateDemos, templateManifests, type TemplateDemo } from "@/templates/registry";
import RoyalHeritage from "@/templates/royal-heritage";
import MinimalLuxury from "@/templates/minimal-luxury";
import Deepam from "@/templates/deepam";
import Meenakshi from "@/templates/meenakshi";
import Mandir from "@/templates/mandir";
import Kashi from "@/templates/kashi";
import Deepotsav from "@/templates/deepotsav";
import Starter from "@/templates/_starter";
import { starterManifest } from "@/templates/_starter/manifest";
import { starterDemo } from "@/templates/_starter/demo";

type Case = {
  manifest: TemplateManifest;
  demo: TemplateDemo;
  Component: ComponentType<{ data: RenderableInvitation }>;
};

const CASES: Case[] = [
  {
    manifest: templateManifests["royal-heritage"],
    demo: templateDemos["royal-heritage"],
    Component: RoyalHeritage,
  },
  {
    manifest: templateManifests["minimal-luxury"],
    demo: templateDemos["minimal-luxury"],
    Component: MinimalLuxury,
  },
  {
    manifest: templateManifests.deepam,
    demo: templateDemos.deepam,
    Component: Deepam,
  },
  {
    manifest: templateManifests.meenakshi,
    demo: templateDemos.meenakshi,
    Component: Meenakshi,
  },
  {
    manifest: templateManifests.mandir,
    demo: templateDemos.mandir,
    Component: Mandir,
  },
  {
    manifest: templateManifests.kashi,
    demo: templateDemos.kashi,
    Component: Kashi,
  },
  {
    manifest: templateManifests.deepotsav,
    demo: templateDemos.deepotsav,
    Component: Deepotsav,
  },
  { manifest: starterManifest, demo: starterDemo, Component: Starter },
];

const setReducedMotion = (v: boolean) =>
  ((globalThis as { __reducedMotion?: boolean }).__reducedMotion = v);

function build(c: Case, opts: { design?: Partial<DesignConfig>; guest?: boolean } = {}) {
  const design = { ...defaultDesign(c.manifest), ...c.demo.design, ...opts.design };
  return resolveRenderable({
    manifest: c.manifest,
    content: c.demo.content,
    design,
    mode: "DEMO",
    key: `test:${c.manifest.slug}:${Math.random()}`,
    guest: opts.guest ? demoGuest(c.demo.guestEventIds) : null,
  });
}

const phase = (container: HTMLElement) =>
  container.querySelector<HTMLElement>("[data-phase]")?.dataset.phase;

afterEach(() => {
  cleanup();
  setReducedMotion(false);
  sessionStorage.clear();
  document.documentElement.style.overflow = "";
});

describe.each(CASES)("template: $manifest.slug", (c) => {
  it("has a valid manifest", () => {
    expect(() => assertValidManifest(c.manifest)).not.toThrow();
    for (const s of REQUIRED_SECTIONS) expect(c.manifest.supportedSections).toContain(s);
  });

  it("renders demo data with envelope and required sections", () => {
    const data = build(c);
    const { container } = render(<c.Component data={data} />);
    expect(screen.getByRole("button", { name: /open invitation/i })).toBeInTheDocument();
    for (const s of REQUIRED_SECTIONS)
      expect(container.querySelector(`[data-section="${s}"]`)).not.toBeNull();
    expect(container.querySelector("#invite-title")).not.toBeNull();
    expect(phase(container)).toBe("closed");
    // Content is hidden from assistive tech while the envelope is closed.
    expect(container.querySelector("[inert]")).not.toBeNull();
  });

  it("completes the opening sequence (reduced motion)", async () => {
    setReducedMotion(true);
    const { container } = render(<c.Component data={build(c)} />);
    await act(async () =>
      fireEvent.click(screen.getByRole("button", { name: /open invitation/i })),
    );
    await waitFor(() => expect(phase(container)).toBe("open"), { timeout: 3000 });
    expect(container.querySelector("[data-envelope]")).toBeNull();
    await waitFor(() => expect(document.documentElement.style.overflow).toBe(""));
  });

  it("completes the full opening sequence (SUBTLE)", async () => {
    const data = build(c, {
      design: {
        animation: { intensity: "SUBTLE", envelope: true, particles: true, autoplayMusic: true },
      },
    });
    const { container } = render(<c.Component data={data} />);
    await act(async () =>
      fireEvent.click(screen.getByRole("button", { name: /open invitation/i })),
    );
    await waitFor(() => expect(phase(container)).toBe("open"), { timeout: 8000 });
    expect(screen.getByRole("button", { name: /pause music|play music/i })).toBeInTheDocument();
  }, 10000);

  it("can skip the intro mid-sequence", async () => {
    const { container } = render(<c.Component data={build(c)} />);
    await act(async () =>
      fireEvent.click(screen.getByRole("button", { name: /open invitation/i })),
    );
    await act(async () => fireEvent.click(screen.getByRole("button", { name: /skip intro/i })));
    expect(phase(container)).toBe("open");
  });

  it("renders without the envelope when disabled", () => {
    const data = build(c, {
      design: {
        animation: {
          intensity: "STANDARD",
          envelope: false,
          particles: false,
          autoplayMusic: false,
        },
      },
    });
    const { container } = render(<c.Component data={data} />);
    expect(phase(container)).toBe("open");
    expect(screen.queryByRole("button", { name: /open invitation/i })).toBeNull();
  });

  it("personalises for a guest and never renders uninvited events", () => {
    const data = build(c, { guest: true });
    const { container } = render(<c.Component data={data} />);
    expect(container.textContent).toContain("Sharma");
    const all = (c.demo.content.events ?? []) as Array<{ id: string; venue: { name: string } }>;
    for (const e of all.filter((e) => !c.demo.guestEventIds.includes(e.id))) {
      expect(container.textContent).not.toContain(e.venue.name);
    }
  });

  it("renders every palette, font pair and option value", () => {
    for (const p of c.manifest.palettes) {
      for (const f of c.manifest.fontPairs) {
        const { unmount } = render(
          <c.Component data={build(c, { design: { paletteId: p.id, fontPairId: f.id } })} />,
        );
        unmount();
      }
    }
    for (const opt of c.manifest.options) {
      const values = opt.type === "boolean" ? [true, false] : opt.choices.map((ch) => ch.value);
      for (const v of values) {
        const { container, unmount } = render(
          <c.Component data={build(c, { design: { templateOptions: { [opt.key]: v } } })} />,
        );
        expect(container.querySelector('[data-section="hero"]')).not.toBeNull();
        unmount();
      }
    }
  });
});
