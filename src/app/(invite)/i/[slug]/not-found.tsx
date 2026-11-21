import Link from "next/link";

/** Shown for unknown, unpublished, archived or disabled invitations. Reveals nothing about which. */
export default function InvitationNotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas px-6 text-center">
      <div className="max-w-sm">
        <p className="font-display text-5xl text-gold" aria-hidden="true">
          ✦
        </p>
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">
          This invitation isn&apos;t available
        </h1>
        <p className="mt-3 text-ink-soft">
          The link may be mistyped, or the hosts may have taken it down for now. Please check with
          them for the latest link.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block text-xs tracking-[0.2em] text-muted-foreground uppercase hover:text-ink"
        >
          Vivah Studio
        </Link>
      </div>
    </main>
  );
}
