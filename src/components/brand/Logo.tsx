import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

/** Wordmark from the single brand setting: leading words in ink, last word in gold foil. */
export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "font-display text-[19px] leading-none font-semibold tracking-tight whitespace-nowrap text-ink sm:text-[22px]",
        className,
      )}
      aria-label={`${BRAND.name} home`}
    >
      {BRAND.accent ? (
        <>
          {BRAND.lead} <span className="text-foil font-medium">{BRAND.accent}</span>
        </>
      ) : (
        <>
          {BRAND.name}
          <span className="text-foil not-italic">.</span>
        </>
      )}
    </Link>
  );
}
