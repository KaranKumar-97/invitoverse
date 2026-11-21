import "server-only";
import { AppError } from "@/lib/action-result";
import { ContactSchema, MIN_FILL_MS } from "@/lib/contact";
import { isEmailAddress } from "@/lib/contact-rules";
import { sendEmail } from "@/server/integrations/email";

export type ContactOutcome = "sent" | "dropped";

/**
 * Delivers a landing-page enquiry to the studio inbox. Bots (honeypot filled, or submitted
 * faster than a person can type) are dropped silently so they learn nothing.
 */
export async function submitContact(raw: unknown): Promise<ContactOutcome> {
  const parsed = ContactSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues)
      (fieldErrors[issue.path.map(String).join(".") || "_"] ??= []).push(issue.message);
    throw new AppError("VALIDATION", "Please check the form.", fieldErrors);
  }
  const { name, reply, message, website, elapsedMs } = parsed.data;
  if (website || elapsedMs < MIN_FILL_MS) return "dropped";

  const inbox = process.env.CONTACT_INBOX;
  if (!inbox && process.env.NODE_ENV === "production") {
    console.error("[contact] CONTACT_INBOX is not set; enquiry not delivered");
    throw new AppError("INTERNAL", "We couldn't send your message. Please email or WhatsApp us.");
  }

  try {
    await sendEmail({
      to: inbox ?? "studio@localhost",
      subject: `New enquiry from ${name.slice(0, 60)}`,
      text: `Name: ${name}\nReply to: ${reply}\n\n${message}`,
      replyTo: isEmailAddress(reply) ? reply : undefined,
    });
  } catch (e) {
    console.error("[contact] delivery failed", e);
    throw new AppError("INTERNAL", "We couldn't send your message. Please email or WhatsApp us.");
  }
  return "sent";
}
