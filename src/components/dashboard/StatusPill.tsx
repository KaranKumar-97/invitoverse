import { cn } from "@/lib/utils";

type Status = "DRAFT" | "PUBLISHED" | "ARCHIVED";

const STYLES: Record<Status, string> = {
  DRAFT: "bg-muted text-ink-soft",
  PUBLISHED: "bg-success/10 text-success",
  ARCHIVED: "bg-muted text-muted-foreground",
};
const LABELS: Record<Status, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

export function StatusPill({
  status,
  unpublishedChanges,
  className,
}: {
  status: Status;
  unpublishedChanges?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        STYLES[status],
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn("size-1.5 rounded-full bg-current", unpublishedChanges && "bg-warning")}
      />
      {LABELS[status]}
      {unpublishedChanges && <span className="sr-only"> with unpublished changes</span>}
    </span>
  );
}
