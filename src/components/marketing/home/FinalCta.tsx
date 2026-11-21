import { Button } from "@/components/ui/button";
import { TrackedLink } from "../TrackedLink";

export function FinalCta() {
  return (
    <section className="px-4 pb-20 sm:px-6 lg:px-8">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#5e1621,#7a1f2b_55%,#4a0f18)] px-6 py-16 text-center text-white shadow-float sm:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(231,199,123,0.25),transparent_60%)]"
        />
        <h2 className="text-display-l relative mx-auto max-w-3xl text-balance">
          Your love story deserves a <span className="text-foil">beautiful beginning.</span>
        </h2>
        <Button
          asChild
          className="btn-gold relative mt-9 h-12 rounded-full px-8 text-base text-[#2a1c0c]"
        >
          <TrackedLink href="/templates" event="cta_choose_design" data={{ from: "final" }}>
            Choose a design
          </TrackedLink>
        </Button>
      </div>
    </section>
  );
}
