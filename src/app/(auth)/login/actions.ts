"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { z } from "zod";
import { signIn } from "@/server/auth/config";
import { safeCallbackUrl } from "@/lib/action-result";
import { clientIp, rateLimit } from "@/server/integrations/ratelimit";
import { logEvent } from "@/server/log";

const HOUR = 60 * 60 * 1000;
// docs/13-security.md §1: magic links are rate limited per email and per IP.
const PER_EMAIL = 5;
const PER_IP = 20;

export type EmailSignInState = { error?: string; email?: string };

const EmailInput = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.")),
  callbackUrl: z.string().optional(),
});

export async function signInWithEmail(
  _prev: EmailSignInState,
  formData: FormData,
): Promise<EmailSignInState> {
  const parsed = EmailInput.safeParse({
    email: formData.get("email"),
    callbackUrl: formData.get("callbackUrl") ?? undefined,
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Enter a valid email address.",
      email: String(formData.get("email") ?? ""),
    };
  }
  const ip = clientIp(await headers());
  const emailKey = createHash("sha256").update(parsed.data.email).digest("hex").slice(0, 32);
  const [byEmail, byIp] = await Promise.all([
    rateLimit(`magic:email:${emailKey}`, PER_EMAIL, HOUR),
    rateLimit(`magic:ip:${ip}`, PER_IP, HOUR),
  ]);
  if (!byEmail.ok || !byIp.ok) {
    logEvent("auth.magic_link_rate_limited", { by: byEmail.ok ? "ip" : "email" });
    return {
      error: "Too many sign-in links requested. Please wait a while, or use the last link we sent.",
      email: parsed.data.email,
    };
  }
  logEvent("auth.magic_link_requested");
  // Throws a redirect to /login/check-email on success (must not be caught).
  await signIn("resend", {
    email: parsed.data.email,
    redirectTo: safeCallbackUrl(parsed.data.callbackUrl),
  });
  return {};
}

export async function signInWithGoogle(formData: FormData) {
  await signIn("google", { redirectTo: safeCallbackUrl(formData.get("callbackUrl")) });
}
