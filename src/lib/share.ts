/** Public links and share helpers (isomorphic). */
export function publicInvitationUrl(appUrl: string, slug: string) {
  return `${appUrl.replace(/\/$/, "")}/i/${slug}`;
}

export function whatsappShareUrl(text: string, phone?: string) {
  const digits = phone?.replace(/\D/g, "");
  return `https://wa.me/${digits ?? ""}?text=${encodeURIComponent(text)}`;
}

export function invitationShareText(coupleTitle: string, url: string) {
  return `${coupleTitle} are getting married! 💍\nOpen your invitation: ${url}`;
}

export function guestInvitationUrl(appUrl: string, slug: string, token: string) {
  return `${appUrl.replace(/\/$/, "")}/i/${slug}/guest/${token}`;
}

/** Personal WhatsApp message (docs/08-dashboard-specs.md §6). */
export function guestShareText(
  guest: { displayName: string; greeting: string | null },
  coupleTitle: string,
  url: string,
) {
  const salutation = guest.greeting?.trim() || `Dear ${guest.displayName},`;
  return `${salutation}\n${coupleTitle} would love for you to join their wedding celebrations. 💍\nOpen your invitation: ${url}`;
}
