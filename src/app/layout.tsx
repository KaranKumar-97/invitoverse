import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import { BRAND } from "@/lib/brand";
import { SiteAnalytics } from "@/components/analytics/SiteAnalytics";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz", "SOFT"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: `${BRAND.name} — Animated Invitation Websites`,
    template: `%s · ${BRAND.name}`,
  },
  description:
    "Designer, animated wedding invitation websites — personalized for every guest and shared in one tap on WhatsApp.",
  applicationName: BRAND.name,
  openGraph: {
    type: "website",
    siteName: BRAND.name,
    locale: "en_IN",
    images: [{ url: "/og", width: 1200, height: 630, alt: BRAND.name }],
  },
  twitter: { card: "summary_large_image", images: ["/og"] },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBF8F3" },
    { media: "(prefers-color-scheme: dark)", color: "#120F0D" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // data-theme is set by /theme-init.js before React hydrates.
    <html
      lang="en-IN"
      className={`${inter.variable} ${fraunces.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Blocking on purpose: picks light/dark before first paint (tiny, same-origin, CSP 'self'). */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="/theme-init.js" />
      </head>
      <body>
        {children}
        {/* Only on Vercel: elsewhere /_vercel/insights doesn't exist (and dev loads a third-party
            debug script the CSP blocks). */}
        {process.env.VERCEL === "1" && <SiteAnalytics />}
      </body>
    </html>
  );
}
