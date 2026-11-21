/**
 * Contact form field rules (docs/09 §3.10) without Zod, so the marketing bundle stays small.
 * The browser uses them for inline errors; the server's ContactSchema runs the same rules.
 */
export type ContactFields = { name: string; reply: string; message: string };
export type ContactFieldErrors = Partial<Record<keyof ContactFields, string>>;

/** Anything faster than this is a script, not a person typing. */
export const MIN_FILL_MS = 2500;

export const CONTACT_LIMITS = { name: 80, reply: 120, message: 2000 } as const;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^\+?[\d\s()-]{7,20}$/;

export const isEmailAddress = (v: string) => EMAIL.test(v.trim());

export function contactFieldErrors(f: ContactFields): ContactFieldErrors {
  const errors: ContactFieldErrors = {};
  const name = f.name.trim();
  const reply = f.reply.trim();
  const message = f.message.trim();
  if (!name) errors.name = "Please tell us your name";
  else if (name.length > CONTACT_LIMITS.name) errors.name = "That name is too long";
  if (reply.length < 5) errors.reply = "Add an email or phone number so we can reply";
  else if (reply.length > CONTACT_LIMITS.reply || !(EMAIL.test(reply) || PHONE.test(reply)))
    errors.reply = "Enter a valid email or phone number";
  if (message.length < 10) errors.message = "A few more words, please";
  else if (message.length > CONTACT_LIMITS.message)
    errors.message = "Please keep it under 2,000 characters";
  return errors;
}
