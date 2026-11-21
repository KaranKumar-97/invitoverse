import { cn } from "@/lib/utils";

/** Device chrome around a 9:19.5 screen. Children fill the screen. */
export function PhoneFrame({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn(
        "relative aspect-[390/844] rounded-[2.4rem] bg-[#17130f] p-[7px] shadow-[0_0_0_1.5px_color-mix(in_srgb,var(--gold-1)_70%,transparent),var(--shadow-float)]",
        className,
      )}
      style={style}
    >
      <div className="relative size-full overflow-hidden rounded-[2rem] bg-black">
        {children}
        <span
          aria-hidden
          className="absolute top-2 left-1/2 h-[18px] w-[30%] -translate-x-1/2 rounded-full bg-black"
        />
      </div>
    </div>
  );
}
