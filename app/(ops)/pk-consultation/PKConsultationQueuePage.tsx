"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store/useAppStore";
import { PageHeader } from "@/app/components/shell/PageHeader";
import type { PKConsultationStatus } from "@/lib/types/treatmentV2";
import { formatDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import { MessageSquare, Search, CheckCircle2, Clock, ChevronRight, User, DollarSign } from "lucide-react";

const statusConfig: Record<PKConsultationStatus, { label: string; cls: string }> = {
  pending:           { label: "Pending",          cls: "bg-slate-100 text-slate-600 border-slate-200" },
  scheduled:         { label: "Scheduled",        cls: "bg-amber-50 text-amber-700 border-amber-200" },
  completed:         { label: "Completed",        cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  follow_up_pending: { label: "Follow-up Pending",cls: "bg-violet-50 text-violet-700 border-violet-200" },
};

export function PKConsultationQueuePage() {
  const { pkConsultationV2Records, patients, pracharakas } = useAppStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PKConsultationStatus | "all">("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const enriched = useMemo(() =>
    pkConsultationV2Records.map((c) => ({
      c,
      patient: patients.find((p) => p.id === c.patientId),
      pr:      pracharakas.find((p) => p.id === patients.find((pt) => pt.id === c.patientId)?.pracharakaId),
    })),
    [pkConsultationV2Records, patients, pracharakas]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return enriched.filter(({ c, patient }) => {
      if (q && !patient?.name.toLowerCase().includes(q) && !c.id.toLowerCase().includes(q)) return false;
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      return true;
    });
  }, [enriched, search, statusFilter]);

  const stats = {
    total:     pkConsultationV2Records.length,
    pending:   pkConsultationV2Records.filter((c) => c.status !== "completed").length,
    completed: pkConsultationV2Records.filter((c) => c.status === "completed").length,
  };

  return (
    <div className="space-y-5 max-w-7xl">
      <PageHeader title="Panchakarma Consultation" subtitle="Orient patients, confirm PK treatment, and issue Amapachana prescriptions." />

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total",    value: stats.total,     Icon: MessageSquare, col: "text-violet-600",  bg: "bg-violet-50" },
          { label: "Pending",  value: stats.pending,   Icon: Clock,         col: "text-amber-600",   bg: "bg-amber-50" },
          { label: "Completed",value: stats.completed, Icon: CheckCircle2,  col: "text-emerald-600", bg: "bg-emerald-50" },
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

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search patient or record ID…"
            className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 pl-8 pr-3 text-sm text-slate-700 focus:border-violet-400 focus:bg-white focus:outline-none" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}
          className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:border-violet-400 focus:outline-none">
          <option value="all">All Statuses</option>
          {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white py-16 text-center">
          <MessageSquare className="mx-auto mb-2 h-6 w-6 text-slate-300" />
          <p className="text-sm text-slate-500">No PK consultations yet.</p>
          <p className="mt-1 text-xs text-slate-400">Consultations are created when a Treatment Plan is approved.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(({ c, patient, pr }) => {
            const st = statusConfig[c.status];
            const checklistDone = Object.values(c.checklistItems || {}).filter(Boolean).length;
            const checklistTotal = Object.keys(c.checklistItems || {}).length;

            return (
              <Link 
                key={c.id} 
                href={`/pk-consultation/${c.patientId}`}
                className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-violet-300 transition-all flex flex-col"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-violet-100 flex items-center justify-center text-sm font-bold text-violet-700">
                      {patient?.name.slice(0, 2).toUpperCase() ?? "??"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{patient?.name ?? c.patientId}</p>
                      <p className="text-[10px] text-slate-400">{c.patientId}</p>
                    </div>
                  </div>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-mono font-medium text-slate-500">
                    {c.id}
                  </span>
                </div>

                {/* Info grid */}
                <div className="space-y-1.5 mb-3 flex-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Pracharaka</span>
                    <span className="font-medium text-slate-700 truncate max-w-[60%]">{pr?.name ?? "—"}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Consultation Fee</span>
                    <span className={cn("inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-medium",
                      c.feePaid ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500")}>
                      <DollarSign className="h-3 w-3" />${c.feePaidUSD} {c.feePaid ? "✓" : "Pending"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Orientation</span>
                    <span className="font-medium text-slate-700">{checklistDone}/{checklistTotal || "—"} items</span>
                  </div>
                </div>

                {/* Status chips */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium", st.cls)}>
                    {st.label}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                    {formatDate(c.createdAt)}
                  </span>
                </div>

                {/* CTA */}
                <div className="mt-auto border-t border-slate-100 pt-3 flex items-center justify-end">
                  <span className="text-[11px] font-medium text-slate-400 group-hover:text-violet-600 flex items-center gap-1 transition-colors">
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
