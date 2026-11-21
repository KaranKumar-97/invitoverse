import type { Metadata } from "next";
import { About } from "@/components/marketing/home/About";
import { Contact } from "@/components/marketing/home/Contact";
import { Faq } from "@/components/marketing/home/Faq";
import { Features } from "@/components/marketing/home/Features";
import { FinalCta } from "@/components/marketing/home/FinalCta";
import { Hero } from "@/components/marketing/home/Hero";
import { HowItWorks } from "@/components/marketing/home/HowItWorks";
import { OpeningMoment } from "@/components/marketing/home/OpeningMoment";
import { PersonalInvites } from "@/components/marketing/home/PersonalInvites";
import { Showcase } from "@/components/marketing/home/Showcase";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FAQ } from "@/lib/marketing/content";
import { SITE } from "@/lib/marketing/site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <Showcase />
      <HowItWorks />
      <OpeningMoment />
      <PersonalInvites />
      <Features />
      <Faq />
      <About />
      <Contact />
      <FinalCta />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": `${SITE.url}/#org`,
              name: SITE.name,
              url: SITE.url,
              ...(SITE.email ? { email: SITE.email } : {}),
              description: SITE.mission,
            },
            {
              "@type": "WebSite",
              name: SITE.name,
              url: SITE.url,
              publisher: { "@id": `${SITE.url}/#org` },
            },
            {
              "@type": "FAQPage",
              mainEntity: FAQ.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            },
          ],
        }}
      />
    </>
  );
}
