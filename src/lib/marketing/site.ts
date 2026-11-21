/** Studio-wide marketing config (plain module: safe for server and client). */
export const SITE = {
  name: "Vivah Studio",
  url: (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  tagline: "Animated wedding invitation websites",
  mission: "Designer, animated invitation websites — personalized for every guest.",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@vivah.studio",
  /** Digits only, with country code, e.g. 919876543210. Chip and links hide when unset. */
  whatsapp: (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, ""),
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "",
  announcement: "Launch offer — every design is free while we're in beta",
  featuredDemo: "royal-heritage",
} as const;

export function whatsappChatUrl(
  text = "Hi Vivah Studio! I have a question about wedding invitations.",
) {
  return SITE.whatsapp ? `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}` : null;
}
