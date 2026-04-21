"use client";

import { cn } from "@/lib/utils/cn";

interface OnboardingProgressBarProps {
  completed: number;
  total: number;
  showLabel?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function OnboardingProgressBar({
  completed,
  total,
  showLabel = true,
  size = "md",
  className,
}: OnboardingProgressBarProps) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  const isComplete = completed === total;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "flex-1 rounded-full bg-slate-200 overflow-hidden",
          size === "sm" ? "h-1" : "h-1.5"
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            isComplete ? "bg-emerald-500" : pct >= 66 ? "bg-blue-500" : pct >= 33 ? "bg-amber-500" : "bg-slate-400"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span
          className={cn(
            "shrink-0 font-medium tabular-nums",
            size === "sm" ? "text-[10px] text-slate-500" : "text-[11px] text-slate-600"
          )}
        >
          {completed}/{total}
        </span>
      )}
    </div>
  );
}
