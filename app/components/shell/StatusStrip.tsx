"use client";

import { useAppStore } from "@/lib/store/useAppStore";
import type { StageId } from "@/lib/types";

interface StageCount {
  stageId: StageId;
  label: string;
  count: number;
  colorClass: string;
}

const STAGE_CONFIG: { stageId: StageId; label: string; colorClass: string }[] = [
  { stageId: "wish-list",         label: "Wish List",     colorClass: "bg-purple-100 text-purple-700" },
  { stageId: "astro-eligibility", label: "Astro Elig.",   colorClass: "bg-indigo-100 text-indigo-700" },
  { stageId: "screening",         label: "Screening",     colorClass: "bg-teal-100 text-teal-700" },
  { stageId: "treatment-plan",    label: "Trt. Plan",     colorClass: "bg-green-100 text-green-700" },
  { stageId: "pk-consultation",   label: "PK Consult",    colorClass: "bg-emerald-100 text-emerald-700" },
  { stageId: "reservation",       label: "Reservation",   colorClass: "bg-amber-100 text-amber-700" },
  { stageId: "travel-payment",    label: "Travel/Pay",    colorClass: "bg-orange-100 text-orange-700" },
  { stageId: "admission",         label: "In Program",    colorClass: "bg-rose-100 text-rose-700" },
];

export function StatusStrip() {
  const { patients, operationalAlerts } = useAppStore();
  const highPriority = operationalAlerts.filter((a) => !a.isResolved && a.priority === "high").length;

  const stageCounts: StageCount[] = STAGE_CONFIG.map((cfg) => ({
    ...cfg,
    count: patients.filter((p) => p.currentStage === cfg.stageId).length,
  }));

  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 bg-white px-6 py-2 text-xs">
      <span className="shrink-0 font-medium text-slate-500 mr-2">Pipeline:</span>
      {stageCounts.map((s) => (
        <span
          key={s.stageId}
          className={`inline-flex shrink-0 items-center gap-1 rounded px-2 py-0.5 font-medium ${s.colorClass}`}
        >
          <span>{s.label}</span>
          <span className="font-bold">{s.count}</span>
        </span>
      ))}
      {highPriority > 0 && (
        <>
          <span className="mx-2 h-3 w-px bg-slate-200 shrink-0" />
          <span className="inline-flex shrink-0 items-center gap-1 rounded bg-red-100 px-2 py-0.5 font-medium text-red-700">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            {highPriority} High-Priority Alert{highPriority !== 1 ? "s" : ""}
          </span>
        </>
      )}
    </div>
  );
}
