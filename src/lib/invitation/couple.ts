import type { InvitationContent } from "./schema";

type Couple = InvitationContent["couple"];

/** Names in display order: [first, second]. */
export function orderedNames(couple: Couple): [string, string] {
  return couple.order === "GROOM_FIRST"
    ? [couple.groom.firstName, couple.bride.firstName]
    : [couple.bride.firstName, couple.groom.firstName];
}

/** "Meera & Aarav" */
export function coupleTitle(couple: Couple, joiner = "&"): string {
  const [a, b] = orderedNames(couple);
  return `${a} ${joiner} ${b}`;
}

/** Explicit monogram, else initials in display order ("MA"). */
export function monogram(couple: Couple): string {
  if (couple.monogram) return couple.monogram.toUpperCase();
  const [a, b] = orderedNames(couple);
  return `${[...a][0] ?? ""}${[...b][0] ?? ""}`.toUpperCase();
}
