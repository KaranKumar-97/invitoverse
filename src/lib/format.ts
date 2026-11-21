/** Two-letter initials from a name, falling back to the email's local part. */
export function initials(
  name: string | null | undefined,
  email: string | null | undefined,
): string {
  const source = name?.trim() || email?.split("@")[0] || "?";
  const parts = source.split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : source.slice(0, 2)).toUpperCase();
}
