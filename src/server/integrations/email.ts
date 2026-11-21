import "server-only";

/**
 * Transactional email via the Resend REST API (no SDK). Uses the same key as magic links.
 * In development without a key, the message is printed to the server console instead.
 */
export type EmailMessage = { to: string; subject: string; text: string; replyTo?: string };

export function emailConfigured() {
  return Boolean(process.env.AUTH_RESEND_KEY);
}

export async function sendEmail(msg: EmailMessage): Promise<void> {
  const key = process.env.AUTH_RESEND_KEY;
  if (!key) {
    if (process.env.NODE_ENV === "production") throw new Error("Email is not configured");
    console.info(`\n[email] To: ${msg.to}\nSubject: ${msg.subject}\n\n${msg.text}\n`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "Vivah Studio <onboarding@resend.dev>",
      to: [msg.to],
      subject: msg.subject,
      text: msg.text,
      ...(msg.replyTo ? { reply_to: msg.replyTo } : {}),
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Resend responded ${res.status}`);
}
