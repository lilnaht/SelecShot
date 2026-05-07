import { STATUS_LABELS } from "@/lib/constants";
import type { AnalysisStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type AnalysisStatusBadgeProps = {
  status: AnalysisStatus;
};

const variants: Record<AnalysisStatus, string> = {
  pending: "border-sky-300/25 bg-sky-300/10 text-sky-200",
  uploading: "border-violet-300/25 bg-violet-300/10 text-violet-200",
  processing: "border-amber-300/25 bg-amber-300/10 text-amber-200",
  done: "border-emerald-300/25 bg-emerald-300/10 text-emerald-200",
  failed: "border-red-300/25 bg-red-300/10 text-red-200",
};

export function AnalysisStatusBadge({ status }: AnalysisStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        variants[status]
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

