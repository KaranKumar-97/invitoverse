import Link from "next/link";
import { Mail } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { SITE, whatsappChatUrl } from "@/lib/marketing/site";
import { WhatsAppIcon } from "./WhatsAppChip";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/templates", label: "Designs" },
      { href: "/#how-it-works", label: "How it works" },
      { href: "/#faq", label: "FAQ" },
    ],
    soon: "Pricing",
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/login", label: "Sign in" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms" },
      { href: "/privacy", label: "Privacy" },
    ],
  },
] as const;

export function SiteFooter() {
  const wa = whatsappChatUrl();
  return (
    <footer className="border-t border-line bg-surface/50">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)] lg:px-8">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-soft">{SITE.mission}</p>
          <div className="mt-5 flex gap-2">
            <SocialLink href={`mailto:${SITE.email}`} label="Email us">
              <Mail className="size-4" />
            </SocialLink>
            {wa && (
              <SocialLink href={wa} label="WhatsApp us" external>
                <WhatsAppIcon className="size-4" />
              </SocialLink>
            )}
            {SITE.instagram && (
              <SocialLink href={SITE.instagram} label="Instagram" external>
                <InstagramIcon />
              </SocialLink>
            )}
          </div>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="text-eyebrow text-muted-foreground">{col.title}</p>
            <ul className="mt-4 space-y-3 text-sm">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-ink-soft hover:text-ink">
                    {l.label}
                  </Link>
                </li>
              ))}
              {"soon" in col && (
                <li className="text-muted-foreground">
                  {col.soon} <span className="text-xs">(soon)</span>
                </li>
              )}
            </ul>
          </nav>
        ))}
      </div>
      <div className="mx-auto flex max-w-7xl flex-col gap-2 border-t border-line px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:justify-between sm:px-6 lg:px-8">
        <p>© {new Date().getFullYear()} Vivah Studio. All rights reserved.</p>
        <p>
          Made in India <span className="text-maroon">♥</span>
        </p>
      </div>
    </footer>
  );
}

function SocialLink({
  href,
  label,
  external,
  children,
}: {
  href: string;
  label: string;
  external?: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="grid size-10 place-items-center rounded-full border border-line bg-surface text-ink-soft transition-colors hover:text-ink"
    >
      {children}
    </a>
  );
}

function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
