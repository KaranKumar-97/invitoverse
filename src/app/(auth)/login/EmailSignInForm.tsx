"use client";

import { useActionState } from "react";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithEmail, type EmailSignInState } from "./actions";

export function EmailSignInForm({
  callbackUrl,
  primary = false,
}: {
  callbackUrl: string;
  primary?: boolean;
}) {
  const [state, action, pending] = useActionState<EmailSignInState, FormData>(signInWithEmail, {});

  return (
    <form action={action} className="space-y-3" noValidate>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <div className="space-y-1.5">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          defaultValue={state.email}
          required
          aria-invalid={Boolean(state.error)}
          aria-describedby={state.error ? "email-error" : undefined}
          className="h-11 rounded-md bg-surface"
        />
        {state.error && (
          <p id="email-error" className="text-sm text-destructive">
            {state.error}
          </p>
        )}
      </div>
      <Button
        type="submit"
        variant={primary ? "default" : "outline"}
        className="h-11 w-full rounded-full"
        disabled={pending}
      >
        {pending ? <Loader2 className="animate-spin" /> : <Mail />}
        Email me a sign-in link
      </Button>
    </form>
  );
}
