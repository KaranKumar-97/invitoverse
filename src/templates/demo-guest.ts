import type { GuestInput } from "@/lib/invitation/resolve";

/** The personalised guest used by template demos (?guest=1). */
export function demoGuest(eventIds: string[]): GuestInput {
  return {
    displayName: "Sharma Family",
    greeting: "Dear Sharma ji and family,",
    personalNote:
      "It would mean the world to have you with us — your blessings made us who we are.",
    eventAccess: "SELECTED",
    eventIds,
  };
}
