"use client";

import Link from "next/link";
import { track, type MarketingEvent } from "@/lib/analytics";

/** next/link that records a marketing event on click. */
export function TrackedLink({
  event,
  data,
  ...props
}: React.ComponentProps<typeof Link> & { event: MarketingEvent; data?: Record<string, string> }) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        track(event, data);
        props.onClick?.(e);
      }}
    />
  );
}
