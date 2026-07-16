import { format } from "date-fns";
import { cn } from "@/lib/utils";

/** Compact table date cell — primary line date, optional time as secondary. */
export function TableDateCell({
  value,
  className,
  showTime = false,
}: {
  value?: string | Date | null;
  className?: string;
  showTime?: boolean;
}) {
  if (!value) {
    return <span className={cn("text-sm text-muted-foreground", className)}>—</span>;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return <span className={cn("text-sm text-muted-foreground", className)}>—</span>;
  }

  return (
    <div className={cn("flex flex-col whitespace-nowrap", className)}>
      <span className="text-sm font-medium text-foreground tabular-nums">
        {format(date, "MMM d, yyyy")}
      </span>
      {showTime && (
        <span className="text-xs text-muted-foreground tabular-nums">
          {format(date, "HH:mm")}
        </span>
      )}
    </div>
  );
}
