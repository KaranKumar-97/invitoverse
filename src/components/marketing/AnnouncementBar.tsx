"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { SITE } from "@/lib/marketing/site";

const KEY = "vs:announcement-dismissed";

/** Dismissible launch banner (docs/09 §2). Rendered hidden until we know it wasn't dismissed. */
export function AnnouncementBar() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    try {
      setVisible(localStorage.getItem(KEY) !== SITE.announcement);
    } catch {
      setVisible(true);
    }
  }, []);
  if (!visible) return null;
  return (
    <div className="relative border-b border-[#d9b06a]/20 bg-[linear-gradient(90deg,#17130f,#241a15,#17130f)] px-10 py-2.5 text-center text-[13px] text-[#f3e3c3]">
      <Link href="/templates" className="underline-offset-4 hover:underline">
        {SITE.announcement} <span aria-hidden>→</span>
      </Link>
      <button
        type="button"
        aria-label="Dismiss announcement"
        onClick={() => {
          setVisible(false);
          try {
            localStorage.setItem(KEY, SITE.announcement);
          } catch {
            /* ignore */
          }
        }}
        className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-white/60 hover:text-white"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
