"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store/useAppStore";
import { PageHeader } from "@/app/components/shell/PageHeader";
import type { ScreeningV2Status } from "@/lib/types/screeningV2";
import { formatDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import {
  Stethoscope, Search, CheckCircle2, Clock, AlertTriangle,
  ChevronRight, User, FileText, Video, CalendarCheck,
} from "lucide-react";
import preReqData from "@/data/screening-pre-requirements.json";

const statusConfig: Record<ScreeningV2Status, { label: string; cls: string }> = {
  awaiting_pre_screening:      { label: "Awaiting Pre-Screening",    cls: "bg-slate-100 text-slate-600 border-slate-200" },
  pre_screening_complete:      { label: "Pre-Screening Complete",    cls: "bg-blue-50 text-blue-700 border-blue-200" },
  consultation_scheduled:      { label: "Consultation Scheduled",    cls: "bg-amber-50 text-amber-700 border-amber-200" },
  initial_consultation_done:   { label: "Initial Consult Done",      cls: "bg-violet-50 text-violet-700 border-violet-200" },
  follow_up_pending:           { label: "Follow-up Pending",         cls: "bg-orange-50 text-orange-700 border-orange-200" },
  follow_up_done:              { label: "Follow-up Done",            cls: "bg-teal-50 text-teal-700 border-teal-200" },
  approved:                    { label: "Approved",                  cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  on_hold:                     { label: "On Hold",                   cls: "bg-rose-50 text-rose-700 border-rose-200" },
};

function preScreeningPct(scr: ReturnType<ReturnType<typeof useAppStore>["screeningV2ByPatientId"]>) {
  if (!scr) return 0;
  let done = 0;
  if (scr.healthQuestionnaireCompleted) done++;
  const docTypes = ["medical_records", "consent_form", "disclaimer"] as const;
  docTypes.forEach((t) => { if (scr.documents.some((d) => d.type === t)) done++; });
  return Math.round((done / preReqData.requirements.length) * 100);
}

export function ScreeningQueuePage() {
  const { screeningV2Records, patients, pracharakas, workflowRecords } = useAppStore();

  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState<ScreeningV2Status | "all">("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const enriched = useMemo(() =>
    screeningV2Records.map((scr) => {
      const patient = patients.find((p) => p.id === scr.patientId);
      const pr      = pracharakas.find((p) => p.id === patient?.pracharakaId);
      const pct     = preScreeningPct(scr);
      return { scr, patient, pr, pct };
    }),
    [screeningV2Records, patients, pracharakas]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return enriched.filter(({ scr, patient }) => {
      if (q && !patient?.name.toLowerCase().includes(q) && !scr.id.toLowerCase().includes(q)) return false;
      if (statusFilter !== "all" && scr.status !== statusFilter) return false;
      return true;
    });
  }, [enriched, search, statusFilter]);

  const stats = {
    total:    screeningV2Records.length,
    pending:  screeningV2Records.filter((s) => !["approved", "on_hold"].includes(s.status)).length,
    approved: screeningV2Records.filter((s) => s.decision === "approved").length,
    onHold:   screeningV2Records.filter((s) => s.decision === "on_hold").length,
  };

  return (
    <div className="space-y-5 max-w-7xl">
      <PageHeader
        title="Medical Screening"
        subtitle="Teleconsultation-based clinical suitability assessments for Panchakarma and Ayurveda treatments."
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Records",   value: stats.total,    Icon: Stethoscope,   col: "text-teal-600",    bg: "bg-teal-50" },
          { label: "In Progress",     value: stats.pending,  Icon: Clock,         col: "text-amber-600",   bg: "bg-amber-50" },
          { label: "Approved",        value: stats.approved, Icon: CheckCircle2,  col: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "On Hold",         value: stats.onHold,   Icon: AlertTriangle, col: "text-rose-600",    bg: "bg-rose-50" },
        ].map(({ label, value, Icon, col, bg }) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500">{label}</p>
              <div className={cn("rounded-md p-1.5", bg)}>
                <Icon className={cn("h-4 w-4", col)} />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {mounted ? value : "—"}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient or record ID…"
            className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 pl-8 pr-3 text-sm text-slate-700 focus:border-teal-400 focus:bg-white focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:border-teal-400 focus:outline-none"
        >
          <option value="all">All Statuses</option>
          {Object.entries(statusConfig).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white py-16 text-center">
          <Stethoscope className="mx-auto mb-2 h-6 w-6 text-slate-300" />
          <p className="text-sm text-slate-500">No screening records found.</p>
          <p className="mt-1 text-xs text-slate-400">
            Patients appear here after their Astrochart Evaluation is marked eligible.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(({ scr, patient, pr, pct }) => {
            const st = statusConfig[scr.status] || { label: scr.status, cls: "bg-slate-100 text-slate-600 border-slate-200" };
            const hasInitial  = !!scr.initialConsultation?.conductedAt;
            const hasFollowUp = !!scr.followUpConsultation?.conductedAt;
            
            return (
              <Link 
                key={scr.id} 
                href={`/screening/${scr.patientId}`}
                className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-teal-300 transition-all flex flex-col"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-teal-100 flex items-center justify-center text-sm font-bold text-teal-700">
                      {patient?.name.slice(0, 2).toUpperCase() ?? "??"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{patient?.name ?? scr.patientId}</p>
                      <p className="text-[10px] text-slate-400">{scr.patientId}</p>
                    </div>
                  </div>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-mono font-medium text-slate-500">
                    {scr.id}
                  </span>
                </div>

                {/* Info grid */}
                <div className="space-y-1.5 mb-3 flex-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Pracharaka</span>
                    <span className="font-medium text-slate-700 truncate max-w-[60%]">{pr?.name ?? "—"}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Pre-Screening</span>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={cn("h-full rounded-full", pct === 100 ? "bg-emerald-500" : "bg-amber-400")}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-medium text-slate-700">{pct}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Consultations</span>
                    <div className="flex items-center gap-1.5">
                      <span className={cn("inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold border", hasInitial ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-400 border-slate-200")}>
                        I
                      </span>
                      <span className={cn("inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold border", hasFollowUp ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-400 border-slate-200")}>
                        F
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status chips */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium", st.cls)}>
                    {st.label}
                  </span>
                </div>

                {/* CTA */}
                <div className="mt-auto border-t border-slate-100 pt-3 flex items-center justify-end">
                  <span className="text-[11px] font-medium text-slate-400 group-hover:text-teal-600 flex items-center gap-1 transition-colors">
                    Open <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
