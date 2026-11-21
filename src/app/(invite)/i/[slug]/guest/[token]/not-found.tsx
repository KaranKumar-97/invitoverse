import Link from "next/link";
import { BRAND } from "@/lib/brand";

/**
 * One page for every failure (unknown, revoked, other invitation's token, unpublished, rate limited)
 * so a link can't be used to learn anything.
 */
export default function GuestLinkNotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas px-6 text-center">
      <div className="max-w-sm">
        <p className="font-display text-5xl text-gold" aria-hidden="true">
          ✦
        </p>
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">
          This invitation link isn&apos;t valid
        </h1>
        <p className="mt-3 text-ink-soft">
          It may have been updated by the hosts, or the invitation is not available right now.
          Please ask them for the latest link.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block text-xs tracking-[0.2em] text-muted-foreground uppercase hover:text-ink"
        >
          {BRAND.name}
        </Link>
      </div>
    </main>
  );
}
