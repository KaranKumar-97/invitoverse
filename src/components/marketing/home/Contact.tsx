import { Mail } from "lucide-react";
import { SITE, whatsappChatUrl } from "@/lib/marketing/site";
import { ContactForm } from "../ContactForm";
import { WhatsAppIcon } from "../WhatsAppChip";
import { SectionHeading } from "./SectionHeading";

export function Contact({ standalone = false }: { standalone?: boolean }) {
  const wa = whatsappChatUrl();
  return (
    <section id="contact" className="scroll-mt-20 py-20 sm:py-24">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:px-8">
        <div>
          <SectionHeading
            eyebrow="Contact"
            title="Let's make something beautiful"
            accent="beautiful"
            lead="Questions about a design, a custom request or anything else — we'd love to hear from you."
            as={standalone ? "h1" : "h2"}
          />
          <ul className="mt-8 space-y-3">
            {wa && (
              <li>
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 font-medium hover:text-maroon"
                >
                  <span className="grid size-10 place-items-center rounded-full bg-[#1f8a4c] text-white">
                    <WhatsAppIcon className="size-5" />
                  </span>
                  Chat on WhatsApp
                </a>
              </li>
            )}
            {SITE.email && (
              <li>
                <a
                  href={`mailto:${SITE.email}`}
                  className="inline-flex items-center gap-3 font-medium hover:text-maroon"
                >
                  <span className="grid size-10 place-items-center rounded-full bg-maroon-soft text-maroon">
                    <Mail className="size-5" />
                  </span>
                  {SITE.email}
                </a>
              </li>
            )}
          </ul>
        </div>
        <ContactForm />
      </div>
    </section>
  );
}
