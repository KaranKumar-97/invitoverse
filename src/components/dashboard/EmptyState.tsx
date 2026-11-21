import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-lg border border-dashed border-line bg-surface/60 px-6 py-14 text-center",
        className,
      )}
    >
      <span className="grid size-14 place-items-center rounded-full bg-maroon-soft text-maroon">
        {icon}
      </span>
      <h2 className="mt-5 font-display text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 max-w-md text-ink-soft">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
