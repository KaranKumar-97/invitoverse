import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "font-display text-[22px] leading-none font-semibold tracking-tight text-ink",
        className,
      )}
      aria-label="Vivah Studio home"
    >
      Vivah<span className="text-foil not-italic">.</span>
      <span className="ml-1 text-[13px] font-medium tracking-[0.18em] text-ink-soft uppercase">
        Studio
      </span>
    </Link>
  );
}
