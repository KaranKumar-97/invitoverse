import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InvitationProvider } from "@/invitation-kit/context";
import { ScratchReveal } from "@/invitation-kit/interactive/ScratchReveal";
import { Carousel } from "@/invitation-kit/media/Carousel";
import { ScrollHint } from "@/invitation-kit/ScrollHint";
import type { RenderableInvitation } from "@/invitation-kit/types";

const ctx = {
  data: {} as RenderableInvitation,
  phase: "open" as const,
  revealed: true,
  reducedMotion: true,
  scale: 0,
};
const wrap = (ui: React.ReactNode) =>
  render(<InvitationProvider value={ctx}>{ui}</InvitationProvider>);

describe("ScratchReveal", () => {
  it("hides the content from assistive tech until revealed; tap fallback reveals it", () => {
    const onReveal = vi.fn();
    const { container } = wrap(
      <ScratchReveal onReveal={onReveal}>
        <p>Sunday 24 January</p>
      </ScratchReveal>,
    );
    expect(container.querySelector('[aria-hidden="true"] p')?.textContent).toBe(
      "Sunday 24 January",
    );
    fireEvent.click(screen.getByRole("button", { name: "Or tap to reveal" }));
    expect(onReveal).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "Or tap to reveal" })).toBeNull();
    expect(container.querySelector('[aria-hidden="true"] p')).toBeNull();
    expect(screen.getByText("Sunday 24 January")).toBeTruthy();
  });
});

describe("Carousel", () => {
  const images = [1, 2, 3].map((n) => ({
    assetId: `a${n}`,
    url: `/x/${n}.svg`,
    width: 800,
    height: 1000,
    alt: `Photo ${n}`,
  }));

  it("names every photo and dot, and opens the tapped photo", () => {
    const onOpen = vi.fn();
    wrap(<Carousel images={images} onOpen={onOpen} />);
    expect(screen.getAllByRole("button", { name: /View photo/ })).toHaveLength(3);
    expect(screen.getAllByRole("button", { name: /Show photo/ })).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: "View photo: Photo 2" }));
    expect(onOpen).toHaveBeenCalledWith(1);
  });
});

describe("ScrollHint", () => {
  it("is decorative (hidden from screen readers)", () => {
    const { container } = render(<ScrollHint active reducedMotion />);
    expect(container.firstElementChild?.getAttribute("aria-hidden")).toBe("true");
  });
});
