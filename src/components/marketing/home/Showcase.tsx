import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CATALOGUE, COMING_SOON } from "@/lib/marketing/catalogue";
import { TemplateGrid } from "../TemplateGrid";
import { SectionHeading } from "./SectionHeading";

export function Showcase() {
  return (
    <section id="designs" className="mk-auto-hide scroll-mt-20 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading eyebrow="Designs" title="Choose your design" accent="design" />
          <Link
            href="/templates"
            className="inline-flex items-center gap-1 text-sm font-medium text-maroon hover:underline"
          >
            View all designs <ArrowRight className="size-4" />
          </Link>
        </div>
        <TemplateGrid items={CATALOGUE} comingSoon={COMING_SOON} className="mt-8" />
      </div>
    </section>
  );
}
