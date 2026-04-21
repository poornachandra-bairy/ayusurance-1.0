"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import { StageStatusBadge } from "./StageStatusBadge";
import type { WorkflowStageId, StageStatus, PatientWorkflowRecord } from "@/lib/types/workflow";
import { WORKFLOW_STAGE_IDS } from "@/lib/types/workflow";
import workflowStagesV2 from "@/data/workflow-stages-v2.json";
import { formatDate, formatDateTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import {
  ChevronDown, ChevronRight, AlertTriangle, CheckCircle2,
  User, Clock, FileText,
} from "lucide-react";

const STATUSES: StageStatus[] = [
  "not_started", "in_progress", "awaiting_input",
  "completed", "on_hold", "not_eligible", "requires_review",
];

const STATUS_LABELS: Record<StageStatus, string> = {
  not_started:     "Not Started",
  in_progress:     "In Progress",
  awaiting_input:  "Awaiting Input",
  completed:       "Completed",
  on_hold:         "On Hold",
  not_eligible:    "Not Eligible",
  requires_review: "Requires Review",
};

interface WorkflowTrackerProps {
  patientId: string;
  /** If true, show abbreviated stage rows (for dashboard/overview) */
  compact?: boolean;
}

export function WorkflowTracker({ patientId, compact = false }: WorkflowTrackerProps) {
  const { workflowRecordByPatientId, updateStageStatus } = useAppStore();
  const [expandedStage, setExpandedStage] = useState<WorkflowStageId | null>(null);
  const [statusEditing, setStatusEditing] = useState<WorkflowStageId | null>(null);

  const record: PatientWorkflowRecord | undefined = workflowRecordByPatientId(patientId);

  if (!record) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
        No workflow record found for this patient.
      </div>
    );
  }

  const stageConfigs = workflowStagesV2.stages;

  function handleStatusChange(stageId: WorkflowStageId, newStatus: StageStatus) {
    updateStageStatus(patientId, stageId, newStatus);
    setStatusEditing(null);
  }

  function daysInStage(rec: typeof record.stages[WorkflowStageId]): string {
    if (!rec.startedAt) return "—";
    if (rec.completedAt) {
      const diff = new Date(rec.completedAt).getTime() - new Date(rec.startedAt).getTime();
      const days = Math.floor(diff / 86400000);
      return `${days}d`;
    }
    const diff = Date.now() - new Date(rec.startedAt).getTime();
    const days = Math.floor(diff / 86400000);
    return `${days}d`;
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">Workflow Tracker</p>
          <p className="text-[11px] text-slate-400">
            Current stage: <span className="font-medium text-slate-600">
              {stageConfigs.find(s => s.id === record.currentWorkflowStageId)?.label ?? record.currentWorkflowStageId}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            {WORKFLOW_STAGE_IDS.filter(id => record.stages[id]?.status === "completed").length} / {WORKFLOW_STAGE_IDS.length} stages complete
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 py-2 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
            {(() => {
              const completed = WORKFLOW_STAGE_IDS.filter(id => record.stages[id]?.status === "completed").length;
              const pct = Math.round((completed / WORKFLOW_STAGE_IDS.length) * 100);
              return (
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              );
            })()}
          </div>
          <span className="shrink-0 text-[10px] font-medium text-slate-500">
            {Math.round((WORKFLOW_STAGE_IDS.filter(id => record.stages[id]?.status === "completed").length / WORKFLOW_STAGE_IDS.length) * 100)}%
          </span>
        </div>
      </div>

      {/* Stage rows */}
      <div className="divide-y divide-slate-50">
        {stageConfigs.map((stage) => {
          const stageId = stage.id as WorkflowStageId;
          const stageRecord = record.stages[stageId];
          const status = stageRecord?.status ?? "not_started";
          const isExpanded = expandedStage === stageId;
          const isCurrent = record.currentWorkflowStageId === stageId;
          const hasBlocker = !!stageRecord?.blockerDescription;

          return (
            <div key={stageId}>
              {/* Stage row */}
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 transition-colors",
                  isCurrent ? "bg-blue-50/40" : "hover:bg-slate-50/60",
                  compact ? "py-2" : "py-2.5"
                )}
              >
                {/* Stage number */}
                <div className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                  status === "completed"
                    ? "bg-emerald-500 text-white"
                    : isCurrent
                    ? "bg-blue-500 text-white"
                    : "bg-slate-200 text-slate-500"
                )}>
                  {status === "completed" ? <CheckCircle2 className="h-3.5 w-3.5" /> : stage.order}
                </div>

                {/* Stage name + owner */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn(
                      "text-sm font-medium truncate",
                      isCurrent ? "text-blue-800" : status === "completed" ? "text-slate-500" : "text-slate-800"
                    )}>
                      {stage.label}
                    </span>
                    {isCurrent && (
                      <span className="inline-flex items-center rounded bg-blue-100 px-1.5 py-0 text-[9px] font-semibold text-blue-700 uppercase tracking-wide">
                        Current
                      </span>
                    )}
                    {hasBlocker && (
                      <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                    )}
                  </div>
                  {!compact && (
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                        <User className="h-2.5 w-2.5" />
                        {stage.owner}
                      </span>
                      {stageRecord?.startedAt && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                          <Clock className="h-2.5 w-2.5" />
                          {daysInStage(stageRecord)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Status badge (clickable) */}
                <div className="relative shrink-0">
                  {statusEditing === stageId ? (
                    <div className="absolute right-0 top-0 z-20 min-w-[160px] rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                      {STATUSES.map((s) => (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(stageId, s)}
                          className={cn(
                            "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-slate-50",
                            s === status ? "font-medium text-slate-800" : "text-slate-600"
                          )}
                        >
                          <StageStatusBadge status={s} size="sm" />
                          {STATUS_LABELS[s]}
                        </button>
                      ))}
                      <button
                        onClick={() => setStatusEditing(null)}
                        className="mt-1 w-full rounded px-2 py-1 text-center text-[10px] text-slate-400 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); setStatusEditing(stageId); }}
                      title="Click to change status"
                      className="cursor-pointer"
                    >
                      <StageStatusBadge status={status} size={compact ? "sm" : "md"} />
                    </button>
                  )}
                </div>

                {/* Expand toggle */}
                {!compact && (
                  <button
                    onClick={() => setExpandedStage(isExpanded ? null : stageId)}
                    className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                  >
                    {isExpanded
                      ? <ChevronDown className="h-4 w-4" />
                      : <ChevronRight className="h-4 w-4" />
                    }
                  </button>
                )}
              </div>

              {/* Expanded detail */}
              {isExpanded && !compact && (
                <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 ml-9 space-y-3">
                  {/* Stage description */}
                  <p className="text-xs text-slate-600">{stage.description}</p>

                  {/* Blocker */}
                  {hasBlocker && (
                    <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                      <div>
                        <p className="text-xs font-medium text-amber-800">Blocker</p>
                        <p className="text-xs text-amber-700">{stageRecord?.blockerDescription}</p>
                      </div>
                    </div>
                  )}

                  {/* Required actions */}
                  <div>
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Required Actions
                    </p>
                    <ul className="space-y-1">
                      {stage.requiredActions.map((action, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                          <span className={cn(
                            "mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full",
                            status === "completed" ? "bg-emerald-400" : "bg-slate-300"
                          )} />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Dates */}
                  <div className="flex gap-6 text-xs">
                    <div>
                      <p className="text-[10px] text-slate-400">Started</p>
                      <p className="font-medium text-slate-700">{formatDate(stageRecord?.startedAt)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Completed</p>
                      <p className="font-medium text-slate-700">{formatDate(stageRecord?.completedAt)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Owner</p>
                      <p className="font-medium text-slate-700">{stageRecord?.assignedTo ?? stage.owner}</p>
                    </div>
                  </div>

                  {/* Notes */}
                  {stageRecord?.notes && (
                    <div className="rounded border border-slate-200 bg-white px-3 py-2">
                      <p className="text-[10px] font-semibold text-slate-400 mb-1">Stage Notes</p>
                      <p className="text-xs text-slate-600">{stageRecord.notes}</p>
                    </div>
                  )}

                  {/* SLA */}
                  <p className="text-[10px] text-slate-400 flex items-center gap-1">
                    <FileText className="h-2.5 w-2.5" />
                    SLA: {stage.sla}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
