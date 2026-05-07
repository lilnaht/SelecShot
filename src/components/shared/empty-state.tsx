import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-40 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-white/10 bg-white/[0.025] p-6 text-center",
        className
      )}
    >
      {Icon && (
        <div className="flex size-10 items-center justify-center rounded-lg bg-white/[0.06] text-sky-200">
          <Icon aria-hidden="true" />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <p className="font-medium text-foreground">{title}</p>
        {description && (
          <p className="max-w-sm text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

