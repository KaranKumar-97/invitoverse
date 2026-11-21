"use client";

import { useEffect } from "react";

/** Last-resort boundary when the root layout itself fails. Must render its own <html>. */
export default function GlobalError({
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
    <html lang="en-IN">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          background: "#FBF8F3",
          color: "#17130F",
        }}
      >
        <main
          style={{
            minHeight: "100dvh",
            display: "grid",
            placeItems: "center",
            padding: 16,
            textAlign: "center",
          }}
        >
          <div>
            <h1 style={{ fontSize: 28, margin: 0 }}>Something went wrong.</h1>
            <p style={{ color: "#4A433B" }}>Please try again in a moment.</p>
            <button
              type="button"
              onClick={reset}
              style={{
                marginTop: 16,
                height: 44,
                padding: "0 24px",
                borderRadius: 999,
                border: 0,
                background: "#17130F",
                color: "#fff",
              }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
