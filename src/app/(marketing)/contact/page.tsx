import type { Metadata } from "next";
import { Contact } from "@/components/marketing/home/Contact";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Questions about a design or a custom request? Message Vivah Studio on WhatsApp or email.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return <Contact standalone />;
}
