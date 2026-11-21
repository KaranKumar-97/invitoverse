/** Studio-wide marketing config (plain module: safe for server and client). */
import { BRAND } from "@/lib/brand";
export const SITE = {
  name: BRAND.name,
  url: (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  tagline: "Animated wedding invitation websites",
  mission: "Designer, animated invitation websites — personalized for every guest.",
  /** Public contact email; email links are hidden when unset. */
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
  /** Digits only, with country code, e.g. 919876543210. Chip and links hide when unset. */
  whatsapp: (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, ""),
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "",
  announcement: "Launch offer — every design is free while we're in beta",
  featuredDemo: "royal-heritage",
} as const;

export function whatsappChatUrl(text = `Hi ${BRAND.name}! I have a question about invitations.`) {
  return SITE.whatsapp ? `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}` : null;
}

/** "email hello@… " when a contact email is configured, otherwise points to the contact page. */
export function contactPhrase(prefix = "write to") {
  return SITE.email ? `${prefix} ${SITE.email}` : "use the form on our Contact page";
}
