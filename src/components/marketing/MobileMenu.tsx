"use client";

import Link from "next/link";
import { useRef } from "react";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MAIN_NAV } from "./nav";

/**
 * Mobile navigation on the native <dialog> element: modal focus trap, Escape to close and
 * inert background for free — no dialog library on marketing pages.
 */
export function MobileMenu() {
  const ref = useRef<HTMLDialogElement>(null);
  const close = () => ref.current?.close();

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className="-mr-2 grid size-11 place-items-center rounded-full text-ink md:hidden"
        aria-label="Open menu"
        aria-haspopup="dialog"
      >
        <Menu className="size-5" />
      </button>
      <dialog
        ref={ref}
        aria-label="Menu"
        onClick={(e) => e.target === e.currentTarget && close()}
        className="mk-sheet m-0 ml-auto h-dvh max-h-none w-[min(20rem,85vw)] bg-canvas p-0 text-ink shadow-float backdrop:bg-black/40 md:hidden"
      >
        <div className="flex h-full flex-col px-6 pt-4">
          <button
            type="button"
            onClick={close}
            aria-label="Close menu"
            className="-mr-2 grid size-11 place-items-center self-end rounded-full text-ink-soft"
          >
            <X className="size-5" />
          </button>
          <nav aria-label="Mobile" className="mt-2 flex flex-col">
            {MAIN_NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={close}
                className="border-b border-line py-4 font-display text-2xl font-semibold tracking-tight"
              >
                {n.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={close}
              className="py-4 text-base font-medium text-ink-soft"
            >
              Sign in
            </Link>
            <div className="flex items-center justify-between border-t border-line py-4 text-base font-medium text-ink-soft">
              Appearance
              <ThemeToggle />
            </div>
          </nav>
        </div>
      </dialog>
    </>
  );
}
