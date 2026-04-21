"use client";

import { cn } from "@/lib/utils/cn";
import type { PracharakaCertificationStatus } from "@/lib/types/pracharaka";

interface CertificationStatusBadgeProps {
  status: PracharakaCertificationStatus;
  size?: "sm" | "md";
}

const CERT_CONFIG: Record<
  PracharakaCertificationStatus,
  { label: string; className: string; dotClass: string }
> = {
  not_enrolled:       { label: "Not Enrolled",       className: "bg-slate-100  text-slate-500  border-slate-200",   dotClass: "bg-slate-400"   },
  enrolled:           { label: "Enrolled",            className: "bg-blue-50    text-blue-700   border-blue-200",    dotClass: "bg-blue-500"    },
  in_training:        { label: "In Training",         className: "bg-indigo-50  text-indigo-700 border-indigo-200",  dotClass: "bg-indigo-500"  },
  assessment_pending: { label: "Assessment Pending",  className: "bg-amber-50   text-amber-700  border-amber-200",   dotClass: "bg-amber-500"   },
  certified:          { label: "SHIVA Certified",     className: "bg-emerald-50 text-emerald-700 border-emerald-200",dotClass: "bg-emerald-500" },
  lapsed:             { label: "Certification Lapsed",className: "bg-red-50     text-red-700    border-red-200",     dotClass: "bg-red-500"     },
};

export function CertificationStatusBadge({
  status,
  size = "md",
}: CertificationStatusBadgeProps) {
  const cfg = CERT_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border font-medium",
        size === "sm" ? "px-1.5 py-0 text-[10px]" : "px-2 py-0.5 text-[11px]",
        cfg.className
      )}
    >
      <span
        className={cn(
          "rounded-full shrink-0",
          size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2",
          cfg.dotClass
        )}
      />
      {cfg.label}
    </span>
  );
}

export { CERT_CONFIG };
