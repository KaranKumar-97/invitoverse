import { scrubSentryEvent, sentryBaseOptions } from "@/lib/observability/sentry-options";

/** Server + edge error tracking. Inactive until SENTRY_DSN is set. */
export async function register() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.init({
    ...sentryBaseOptions,
    dsn,
    // Answers the browser SDK's same-origin tunnel requests (see instrumentation-client.ts).
    integrations: (defaults) => [...defaults, Sentry.serveTunnelIntegration()],
    beforeSend: (event) => scrubSentryEvent(event),
    beforeBreadcrumb: (crumb) => scrubSentryEvent(crumb as never),
  });
}

export async function onRequestError(
  ...args: Parameters<typeof import("@sentry/nextjs").captureRequestError>
) {
  if (!process.env.SENTRY_DSN) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(...args);
}
