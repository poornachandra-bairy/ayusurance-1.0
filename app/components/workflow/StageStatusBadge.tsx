"use client";

import { cn } from "@/lib/utils/cn";
import type { StageStatus } from "@/lib/types/workflow";

interface StageStatusBadgeProps {
  status: StageStatus;
  size?: "sm" | "md";
}

const STATUS_CONFIG: Record<StageStatus, { label: string; className: string; dotClass: string }> = {
  not_started:    { label: "Not Started",    className: "bg-slate-100 text-slate-500 border-slate-200",   dotClass: "bg-slate-400" },
  in_progress:    { label: "In Progress",    className: "bg-blue-50  text-blue-700  border-blue-200",    dotClass: "bg-blue-500" },
  awaiting_input: { label: "Awaiting Input", className: "bg-amber-50 text-amber-700 border-amber-200",   dotClass: "bg-amber-500" },
  completed:      { label: "Completed",      className: "bg-emerald-50 text-emerald-700 border-emerald-200", dotClass: "bg-emerald-500" },
  on_hold:        { label: "On Hold",        className: "bg-purple-50 text-purple-700 border-purple-200", dotClass: "bg-purple-500" },
  not_eligible:   { label: "Not Eligible",   className: "bg-red-50   text-red-700   border-red-200",     dotClass: "bg-red-500" },
  requires_review:{ label: "Requires Review",className: "bg-orange-50 text-orange-700 border-orange-200",dotClass: "bg-orange-500" },
};

export function StageStatusBadge({ status, size = "md" }: StageStatusBadgeProps) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border font-medium",
        size === "sm" ? "px-1.5 py-0 text-[10px]" : "px-2 py-0.5 text-[11px]",
        cfg.className
      )}
    >
      <span className={cn("rounded-full shrink-0", size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2", cfg.dotClass)} />
      {cfg.label}
    </span>
  );
}

export { STATUS_CONFIG };
