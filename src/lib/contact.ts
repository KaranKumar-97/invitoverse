import { z } from "@/lib/zod";
import { contactFieldErrors } from "./contact-rules";

export { MIN_FILL_MS } from "./contact-rules";

/** Server-side contact payload (POST /api/v1/contact). Field rules live in contact-rules.ts. */
export const ContactSchema = z
  .object({
    name: z.string().max(200),
    reply: z.string().max(200),
    message: z.string().max(4000),
    /** Honeypot — real people never see or fill this. */
    website: z.string().max(200).optional().default(""),
    /** ms since the visitor started filling the form (time-to-submit check). */
    elapsedMs: z.number().int().nonnegative().max(86_400_000),
  })
  .superRefine((v, ctx) => {
    for (const [field, message] of Object.entries(contactFieldErrors(v)))
      ctx.addIssue({ code: "custom", path: [field], message });
  })
  .transform((v) => ({
    ...v,
    name: v.name.trim(),
    reply: v.reply.trim(),
    message: v.message.trim(),
  }));

export type ContactInput = z.input<typeof ContactSchema>;
