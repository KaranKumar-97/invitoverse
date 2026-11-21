import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { EnvelopeArt } from "@/components/brand/EnvelopeArt";
import { getOptionalUser } from "@/server/auth/session";
import { googleEnabled } from "@/server/auth/config";
import { safeCallbackUrl } from "@/lib/action-result";
import { EmailSignInForm } from "./EmailSignInForm";
import { signInWithGoogle } from "./actions";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

const ERROR_MESSAGES: Record<string, string> = {
  Verification: "That sign-in link has expired or was already used. Request a new one below.",
  AccessDenied: "This account can't sign in. Contact us if you think this is a mistake.",
  OAuthAccountNotLinked:
    "This email is already linked to a different sign-in method. Use the email link instead.",
  Configuration: "Sign-in is not configured correctly. Please try again later.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl: rawCallback, error } = await searchParams;
  const callbackUrl = safeCallbackUrl(rawCallback);
  if (await getOptionalUser()) redirect(callbackUrl);

  const errorMessage = error
    ? (ERROR_MESSAGES[error] ?? "Something went wrong. Please try again.")
    : null;

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-[#2a0e12] lg:block">
        <EnvelopeArt />
        <div className="absolute inset-x-12 bottom-12 text-[#f6e7c8]">
          <p className="text-eyebrow text-[#cdb78f]">{BRAND.name}</p>
          <p className="mt-3 max-w-md font-display text-4xl leading-tight">
            Invitations that open like a love letter.
          </p>
        </div>
      </aside>

      <section className="relative flex flex-col px-4 py-6 sm:px-8">
        <div aria-hidden className="studio-grain" />
        <div className="flex items-center justify-between">
          <Logo />
          <ThemeToggle />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <h1 className="font-display text-3xl font-semibold tracking-tight">Welcome</h1>
          <p className="mt-2 text-ink-soft">Sign in to create and manage your invitations.</p>

          {errorMessage && (
            <p
              role="alert"
              className="mt-6 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            >
              {errorMessage}
            </p>
          )}

          <div className="mt-8 space-y-5">
            {googleEnabled && (
              <>
                <form action={signInWithGoogle}>
                  <input type="hidden" name="callbackUrl" value={callbackUrl} />
                  <Button type="submit" className="h-11 w-full rounded-full">
                    <GoogleIcon />
                    Continue with Google
                  </Button>
                </form>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="h-px flex-1 bg-line" /> or{" "}
                  <span className="h-px flex-1 bg-line" />
                </div>
              </>
            )}
            <EmailSignInForm callbackUrl={callbackUrl} primary={!googleEnabled} />
          </div>

          <p className="mt-8 text-xs leading-relaxed text-muted-foreground">
            By continuing you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-2 hover:text-ink">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline underline-offset-2 hover:text-ink">
              Privacy Policy
            </Link>
            . We never post anything on your behalf.
          </p>
        </div>
      </section>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
      <path
        fill="#fff"
        d="M21.35 11.1H12v2.98h5.35c-.23 1.5-1.68 4.4-5.35 4.4-3.22 0-5.85-2.67-5.85-5.97S8.78 6.54 12 6.54c1.83 0 3.06.78 3.76 1.45l2.57-2.47C16.68 3.98 14.55 3 12 3 7.03 3 3 7.03 3 12s4.03 9 9 9c5.2 0 8.64-3.65 8.64-8.8 0-.59-.06-1.04-.14-1.49Z"
      />
    </svg>
  );
}
