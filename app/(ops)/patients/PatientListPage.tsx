"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store/useAppStore";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { StageStatusBadge } from "@/app/components/workflow/StageStatusBadge";
import type { WorkflowStageId, StageStatus } from "@/lib/types/workflow";
import { WORKFLOW_STAGE_IDS } from "@/lib/types/workflow";
import workflowStagesV2 from "@/data/workflow-stages-v2.json";
import { daysAgo } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import { Search, ChevronRight, AlertTriangle, Users2, X } from "lucide-react";

const ALL_STATUSES: StageStatus[] = [
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

const OWNER_OPTIONS = [
  { value: "all",             label: "All Owners" },
  { value: "coordinator",     label: "Coordinator" },
  { value: "pracharaka",      label: "Pracharaka" },
  { value: "ayurveda_doctor", label: "Ayurveda Doctor" },
];

export function PatientListPage() {
  const { patients, workflowRecords, pracharakaById } = useAppStore();

  // ── Filter state ───────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<WorkflowStageId | "all">("all");
  const [statusFilter, setStatusFilter] = useState<StageStatus | "all">("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");

  // ── Filtered patients ──────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return patients.filter((p) => {
      // Name / ID / city search
      if (q && !p.name.toLowerCase().includes(q) && !p.id.toLowerCase().includes(q) && !p.city.toLowerCase().includes(q)) {
        return false;
      }
      const wr = workflowRecords.find((r) => r.patientId === p.id);

      // Stage filter
      if (stageFilter !== "all" && wr?.currentWorkflowStageId !== stageFilter) return false;

      // Status filter
      if (statusFilter !== "all" && wr) {
        const rec = wr.stages[wr.currentWorkflowStageId];
        if (rec?.status !== statusFilter) return false;
      }

      // Owner filter
      if (ownerFilter !== "all" && wr) {
        const stageDef = workflowStagesV2.stages.find(s => s.id === wr.currentWorkflowStageId);
        if (stageDef?.ownerRole !== ownerFilter) return false;
      }

      return true;
    });
  }, [patients, workflowRecords, search, stageFilter, statusFilter, ownerFilter]);

  const hasActiveFilters = search || stageFilter !== "all" || statusFilter !== "all" || ownerFilter !== "all";

  function clearFilters() {
    setSearch("");
    setStageFilter("all");
    setStatusFilter("all");
    setOwnerFilter("all");
  }

  return (
    <div className="space-y-5 max-w-7xl">
      <PageHeader
        title="All Patients"
        subtitle="Search and filter the complete patient directory. Click a patient to view their full workflow record."
      />

      {/* ── Search + Filter bar ──────────────────────────────── */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              id="patient-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patient name, ID or city…"
              className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 pl-8 pr-3 text-sm text-slate-700 placeholder-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>

          {/* Stage filter */}
          <select
            id="stage-filter"
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value as WorkflowStageId | "all")}
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            <option value="all">All Stages</option>
            {workflowStagesV2.stages.map((s) => (
              <option key={s.id} value={s.id}>{s.order}. {s.label}</option>
            ))}
          </select>

          {/* Status filter */}
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StageStatus | "all")}
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            <option value="all">All Statuses</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>

          {/* Owner filter */}
          <select
            id="owner-filter"
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            {OWNER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 px-2.5 text-xs text-slate-500 hover:bg-slate-50"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          )}
        </div>

        {/* Result count */}
        <p className="mt-2 text-[11px] text-slate-400">
          Showing {filtered.length} of {patients.length} patient{patients.length !== 1 ? "s" : ""}
          {hasActiveFilters ? " (filtered)" : ""}
        </p>
      </div>

      {/* ── Patient table ─────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white py-16 text-center">
          <Users2 className="mx-auto mb-2 h-6 w-6 text-slate-300" />
          <p className="text-sm text-slate-400">No patients match your filters.</p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="mt-2 text-xs text-blue-600 hover:underline">
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="px-4 py-2.5 text-xs font-medium text-slate-500">Patient</th>
                <th className="px-4 py-2.5 text-xs font-medium text-slate-500">Current Workflow Stage</th>
                <th className="px-4 py-2.5 text-xs font-medium text-slate-500">Stage Status</th>
                <th className="px-4 py-2.5 text-xs font-medium text-slate-500">Owner</th>
                <th className="px-4 py-2.5 text-xs font-medium text-slate-500">Pracharaka</th>
                <th className="px-4 py-2.5 text-xs font-medium text-slate-500">Progress</th>
                <th className="px-4 py-2.5 text-xs font-medium text-slate-500">Last Updated</th>
                <th className="px-4 py-2.5 text-xs font-medium text-slate-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((patient) => {
                const wr = workflowRecords.find((r) => r.patientId === patient.id);
                const pracharaka = pracharakaById(patient.pracharakaId);
                const stageDef = workflowStagesV2.stages.find(s => s.id === wr?.currentWorkflowStageId);
                const currentRecord = wr?.stages[wr.currentWorkflowStageId];
                const completedCount = wr
                  ? WORKFLOW_STAGE_IDS.filter(id => wr.stages[id]?.status === "completed").length
                  : 0;
                const pct = Math.round((completedCount / 12) * 100);
                const hasBlocker = !!currentRecord?.blockerDescription;
                const isStuck = currentRecord?.status === "awaiting_input" || currentRecord?.status === "on_hold" || currentRecord?.status === "requires_review";

                return (
                  <tr
                    key={patient.id}
                    className={cn(
                      "group hover:bg-slate-50 transition-colors",
                      isStuck ? "bg-amber-50/30" : ""
                    )}
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        {(hasBlocker || isStuck) && (
                          <AlertTriangle className="h-3 w-3 shrink-0 text-amber-500" />
                        )}
                        <div>
                          <p className="font-medium text-slate-800">{patient.name}</p>
                          <p className="text-[10px] text-slate-400">{patient.id} · {patient.age}y {patient.gender[0]} · {patient.city}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      {stageDef ? (
                        <div>
                          <p className="text-xs font-medium text-slate-700">{stageDef.label}</p>
                          <p className="text-[10px] text-slate-400">Stage {stageDef.order} of 12</p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {currentRecord ? (
                        <StageStatusBadge status={currentRecord.status} size="sm" />
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-500">
                      {stageDef?.owner ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-500">
                      {pracharaka?.name ?? "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500">{completedCount}/12</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-400">
                      {daysAgo(wr?.updatedAt ?? patient.updatedAt)}
                    </td>
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/patients/${patient.id}`}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-50"
                      >
                        View <ChevronRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
