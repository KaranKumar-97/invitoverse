"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * "Sign in" for visitors, "Dashboard" for signed-in owners. Marketing pages stay static, so the
 * session is checked in the browser (the session cookie is httpOnly). Falls back to "Sign in".
 */
export function AccountLink({ className, onClick }: { className?: string; onClick?: () => void }) {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/auth/session", { signal: ctrl.signal, credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((s: { user?: unknown } | null) => setSignedIn(Boolean(s?.user)))
      .catch(() => {});
    return () => ctrl.abort();
  }, []);

  return (
    <Link href={signedIn ? "/dashboard" : "/login"} onClick={onClick} className={className}>
      {signedIn ? "Dashboard" : "Sign in"}
    </Link>
  );
}
