import type { Metadata } from "next";
import { SectionHeading } from "@/components/marketing/home/SectionHeading";
import { TemplateGrid } from "@/components/marketing/TemplateGrid";
import { CATALOGUE } from "@/lib/marketing/catalogue";

export const metadata: Metadata = {
  title: "Wedding Invitation Designs",
  description:
    "Browse animated wedding invitation designs — royal, minimal and more. Each opens with its own envelope moment. Free during beta.",
  alternates: { canonical: "/templates" },
};

export default function TemplatesPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <SectionHeading
        as="h1"
        eyebrow="Designs"
        title="Choose your design"
        accent="design"
        lead="Every design opens with its own moment. Tap one to see it live — envelope, music and all."
      />
      <TemplateGrid items={CATALOGUE} withUrlState className="mt-10" />
    </section>
  );
}
