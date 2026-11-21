import type { Metadata } from "next";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

export const metadata: Metadata = { title: "Check your email", robots: { index: false } };

export default function CheckEmailPage() {
  return (
    <main className="flex min-h-dvh flex-col px-4 py-6 sm:px-8">
      <Logo />
      <div className="mx-auto flex max-w-sm flex-1 flex-col items-center justify-center text-center">
        <span className="grid size-14 place-items-center rounded-full bg-maroon-soft text-maroon">
          <MailCheck className="size-6" />
        </span>
        <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight">
          Check your inbox
        </h1>
        <p className="mt-3 text-ink-soft">
          We&apos;ve sent you a sign-in link. It expires in 10 minutes and can be used once.
        </p>
        {process.env.NODE_ENV !== "production" && !process.env.AUTH_RESEND_KEY && (
          <p className="mt-4 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
            Development mode: the link is printed in the terminal running <code>pnpm dev</code>.
          </p>
        )}
        <Link
          href="/login"
          className="mt-8 text-sm font-medium text-maroon underline-offset-4 hover:underline"
        >
          Use a different email
        </Link>
      </div>
    </main>
  );
}
