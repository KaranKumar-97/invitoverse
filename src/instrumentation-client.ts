/**
 * Browser error tracking. The SDK is fetched lazily after load and only when a DSN is configured,
 * so pages without Sentry (or before launch) ship none of its code up front.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn && typeof window !== "undefined") {
  const start = () =>
    void Promise.all([import("@sentry/nextjs"), import("@/lib/observability/sentry-options")]).then(
      ([Sentry, { scrubSentryEvent, sentryBaseOptions }]) =>
        Sentry.init({
          ...sentryBaseOptions,
          dsn,
          tunnel: true,
          integrations: [],
          beforeSend: (event) => scrubSentryEvent(event),
          beforeBreadcrumb: (crumb) => scrubSentryEvent(crumb as never),
        }),
    );
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });
}
