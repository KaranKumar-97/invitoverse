import type { Metadata } from "next";
import { Contact } from "@/components/marketing/home/Contact";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Contact",
  description: `Questions about a design or a custom request? Message ${BRAND.name} on WhatsApp or email.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return <Contact standalone />;
}
