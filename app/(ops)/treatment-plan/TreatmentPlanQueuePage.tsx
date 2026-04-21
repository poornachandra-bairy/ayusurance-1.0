"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store/useAppStore";
import { PageHeader } from "@/app/components/shell/PageHeader";
import type { TreatmentPlanV2Status } from "@/lib/types/treatmentV2";
import protocolSections from "@/data/treatment-protocol-sections.json";
import { formatDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import { FileText, Search, CheckCircle2, Clock, ChevronRight, User, FlaskConical } from "lucide-react";

const statusConfig: Record<TreatmentPlanV2Status, { label: string; cls: string }> = {
  draft:                { label: "Draft",                cls: "bg-slate-100 text-slate-600 border-slate-200" },
  protocol_complete:    { label: "Protocol Complete",    cls: "bg-blue-50 text-blue-700 border-blue-200" },
  schedule_distributed: { label: "Schedule Distributed", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  medicines_dispatched: { label: "Medicines Dispatched", cls: "bg-violet-50 text-violet-700 border-violet-200" },
  approved:             { label: "Approved",             cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

function protocolPct(plan: ReturnType<ReturnType<typeof useAppStore>["treatmentPlanV2ByPatientId"]>) {
  if (!plan) return 0;
  const filled = protocolSections.sections.filter((s) => !!(plan.protocol[s.id] ?? "").trim()).length;
  return Math.round((filled / protocolSections.sections.length) * 100);
}

export function TreatmentPlanQueuePage() {
  const { treatmentPlanV2Records, patients, pracharakas } = useAppStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TreatmentPlanV2Status | "all">("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const enriched = useMemo(() =>
    treatmentPlanV2Records.map((plan) => {
      const patient = patients.find((p) => p.id === plan.patientId);
      const pr      = pracharakas.find((p) => p.id === patient?.pracharakaId);
      const pct     = plan.protocol ? protocolPct(plan) : 0;
      return { plan, patient, pr, pct };
    }),
    [treatmentPlanV2Records, patients, pracharakas]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return enriched.filter(({ plan, patient }) => {
      if (q && !patient?.name.toLowerCase().includes(q) && !plan.id.toLowerCase().includes(q)) return false;
      if (statusFilter !== "all" && plan.status !== statusFilter) return false;
      return true;
    });
  }, [enriched, search, statusFilter]);

  const stats = {
    total:    treatmentPlanV2Records.length,
    draft:    treatmentPlanV2Records.filter((t) => t.status === "draft").length,
    approved: treatmentPlanV2Records.filter((t) => t.status === "approved").length,
  };

  return (
    <div className="space-y-5 max-w-7xl">
      <PageHeader title="Treatment Planning" subtitle="Treating Vaidya prepares the full Panchakarma treatment protocol and medicine lists for approved patients." />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Plans",  value: stats.total,    Icon: FileText,    col: "text-indigo-600",  bg: "bg-indigo-50" },
          { label: "In Progress",  value: stats.draft,    Icon: Clock,       col: "text-amber-600",   bg: "bg-amber-50" },
          { label: "Approved",     value: stats.approved, Icon: CheckCircle2,col: "text-emerald-600", bg: "bg-emerald-50" },
        ].map(({ label, value, Icon, col, bg }) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500">{label}</p>
              <div className={cn("rounded-md p-1.5", bg)}><Icon className={cn("h-4 w-4", col)} /></div>
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
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search patient or record ID…"
            className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 pl-8 pr-3 text-sm text-slate-700 focus:border-indigo-400 focus:bg-white focus:outline-none" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}
          className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:border-indigo-400 focus:outline-none">
          <option value="all">All Statuses</option>
          {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white py-16 text-center">
          <FileText className="mx-auto mb-2 h-6 w-6 text-slate-300" />
          <p className="text-sm text-slate-500">No treatment plans yet.</p>
          <p className="mt-1 text-xs text-slate-400">Plans are initiated when screening is approved.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(({ plan, patient, pr, pct }) => {
            const st = statusConfig[plan.status];
            const totalMeds = (plan.medicineCategories || []).reduce((sum, m) => sum + (m.medicines || []).length, 0);

            return (
              <Link 
                key={plan.id} 
                href={`/treatment-plan/${plan.patientId}`}
                className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700">
                      {patient?.name.slice(0, 2).toUpperCase() ?? "??"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{patient?.name ?? plan.patientId}</p>
                      <p className="text-[10px] text-slate-400">{plan.patientId}</p>
                    </div>
                  </div>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-mono font-medium text-slate-500">
                    {plan.id}
                  </span>
                </div>

                {/* Info grid */}
                <div className="space-y-1.5 mb-3 flex-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Pracharaka</span>
                    <span className="font-medium text-slate-700 truncate max-w-[60%]">{pr?.name ?? "—"}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Protocol</span>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-slate-100 overflow-hidden">
                        <div className={cn("h-full rounded-full", pct === 100 ? "bg-emerald-500" : "bg-indigo-400")} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[11px] font-medium text-slate-700">{pct}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Medicines</span>
                    <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600 font-medium">
                      <FlaskConical className="h-3 w-3" /> {totalMeds}
                    </span>
                  </div>
                </div>

                {/* Status chips */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium", st.cls)}>
                    {st.label}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                    {formatDate(plan.createdAt)}
                  </span>
                </div>

                {/* CTA */}
                <div className="mt-auto border-t border-slate-100 pt-3 flex items-center justify-end">
                  <span className="text-[11px] font-medium text-slate-400 group-hover:text-indigo-600 flex items-center gap-1 transition-colors">
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
