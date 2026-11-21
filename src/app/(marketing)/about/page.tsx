import type { Metadata } from "next";
import { About } from "@/components/marketing/home/About";
import { FinalCta } from "@/components/marketing/home/FinalCta";
import { ABOUT } from "@/lib/marketing/content";

export const metadata: Metadata = {
  title: "About",
  description: ABOUT.lead,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <About standalone />
      <div className="pt-20">
        <FinalCta />
      </div>
    </>
  );
}
