"use client";

import { CalendarPlus, MapPin } from "lucide-react";
import { buildIcs } from "@/lib/invitation/ics";
import { coupleTitle } from "@/lib/invitation/couple";
import type { InvitationEvent } from "@/lib/invitation/schema";
import { cn } from "@/lib/utils";
import { useInvitation } from "../context";

function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "event"
  );
}

/** "Directions" + "Add to calendar" buttons. Look comes from the template via className. */
export function EventActions({
  event,
  className,
  buttonClassName,
}: {
  event: InvitationEvent;
  className?: string;
  buttonClassName?: string;
}) {
  const { data } = useInvitation();

  const addToCalendar = () => {
    const ics = buildIcs({
      event,
      timezone: data.content.timezone,
      coupleTitle: coupleTitle(data.content.couple),
      url: typeof window !== "undefined" ? window.location.href.split("?")[0] : undefined,
    });
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slugify(event.name)}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {event.venue.mapsUrl && (
        <a
          href={event.venue.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn("inline-flex min-h-11 items-center gap-2", buttonClassName)}
        >
          <MapPin className="size-4" aria-hidden="true" />
          Directions
        </a>
      )}
      <button
        type="button"
        onClick={addToCalendar}
        className={cn("inline-flex min-h-11 items-center gap-2", buttonClassName)}
      >
        <CalendarPlus className="size-4" aria-hidden="true" />
        Add to calendar
      </button>
    </div>
  );
}
