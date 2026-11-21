"use client";

import Link from "next/link";
import { useEffect } from "react";

/** Route-level error boundary: a calm, branded fallback with a retry. */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN)
      void import("@sentry/nextjs").then((S) => S.captureException(error));
  }, [error]);

  return (
    <main className="grid min-h-dvh place-items-center bg-canvas px-4 text-center">
      <div className="max-w-md">
        <p className="text-eyebrow text-maroon">Something went wrong</p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">
          We couldn&apos;t load this page.
        </h1>
        <p className="mt-3 text-ink-soft">
          Please try again. If it keeps happening, write to us and mention code{" "}
          <span className="font-mono text-sm">{error.digest ?? "—"}</span>.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="h-11 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-full border border-line bg-surface px-6 text-sm font-medium"
          >
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
