"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store/useAppStore";
import { PageHeader } from "@/app/components/shell/PageHeader";
import qcStageDefs from "@/data/qc-stage-definitions.json";
import { formatDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import {
  Shield, CheckCircle2, Clock, Star, ChevronRight,
  User, Search, BarChart3, Download,
} from "lucide-react";

// ── QC Dashboard Queue ────────────────────────────────────────────────────────
export function QualityControlPage() {
  const { patients, qualityChecklists, feedbackRecords, arrivalAdmissionRecords, initiateQCRecord } = useAppStore();
  const [search, setSearch] = useState("");

  // Auto-initiate QC records for admitted patients
  const admitted = arrivalAdmissionRecords.filter((a) => a.isAdmitted);
  useEffect(() => {
    admitted.forEach((adm) => {
      if (!qualityChecklists.some((q) => q.patientId === adm.patientId))
        initiateQCRecord(adm.patientId);
    });
  }, [admitted.length]);

  const enriched = qualityChecklists.map((qc) => {
    const patient  = patients.find((p) => p.id === qc.patientId);
    const feedback = feedbackRecords.find((f) => f.patientId === qc.patientId);

    // Compute per-stage completion
    const stages = qcStageDefs.qcStages.map((stage) => {
      const stageItems  = stage.items.map((i) => `${stage.id}::${i.id}`);
      const done        = stageItems.filter((k) => qc.checklistItems[k]).length;
      return { ...stage, done, total: stageItems.length };
    });

    const totalItems  = stages.reduce((s, st) => s + st.total, 0);
    const totalDone   = stages.reduce((s, st) => s + st.done, 0);
    const overallPct  = totalItems > 0 ? Math.round((totalDone / totalItems) * 100) : 0;

    return { qc, patient, feedback, stages, overallPct };
  });

  const filtered = enriched.filter(({ patient, qc }) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return patient?.name.toLowerCase().includes(q) || qc.id.toLowerCase().includes(q);
  });

  const stats = {
    total:    qualityChecklists.length,
    complete: enriched.filter((e) => e.overallPct === 100).length,
    withFeedback: feedbackRecords.length,
    avgPct: enriched.length > 0
      ? Math.round(enriched.reduce((s, e) => s + e.overallPct, 0) / enriched.length)
      : 0,
  };

  return (
    <div className="space-y-5 max-w-7xl">
      <PageHeader title="Quality Control" subtitle="Stage-wise quality review across Pracharaka certification, screening, treatment, ACO operations, and patient feedback." />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "QC Records",     value: stats.total,       Icon: Shield,       col: "text-slate-600",   bg: "bg-slate-100" },
          { label: "Fully Complete", value: stats.complete,    Icon: CheckCircle2, col: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "With Feedback",  value: stats.withFeedback,Icon: Star,         col: "text-amber-600",   bg: "bg-amber-50" },
          { label: "Avg Score",      value: `${stats.avgPct}%`,Icon: BarChart3,    col: "text-blue-600",    bg: "bg-blue-50" },
        ].map(({ label, value, Icon, col, bg }) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500">{label}</p>
              <div className={cn("rounded-md p-1.5", bg)}><Icon className={cn("h-4 w-4", col)} /></div>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      {/* QC Dimensions legend */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Quality Dimensions</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {qcStageDefs.qcStages.map((s) => (
            <div key={s.id} className="flex items-start gap-2 text-xs text-slate-700">
              <Shield className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">{s.label}</p>
                <p className="text-slate-400">{s.items.length} items</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search patient…"
            className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 pl-8 pr-3 text-sm focus:border-slate-400 focus:bg-white focus:outline-none" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white py-16 text-center">
          <Shield className="mx-auto mb-2 h-6 w-6 text-slate-300" />
          <p className="text-sm text-slate-500">No QC records yet.</p>
          <p className="mt-1 text-xs text-slate-400">QC records are created automatically when patients are admitted.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(({ qc, patient, feedback, stages, overallPct }) => (
            <Link 
              key={qc.id} 
              href={`/quality-control/${qc.patientId}`}
              className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-slate-400 transition-all flex flex-col"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-700">
                    {patient?.name.slice(0, 2).toUpperCase() ?? "??"}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{patient?.name ?? qc.patientId}</p>
                    <p className="text-[10px] text-slate-400">{qc.patientId}</p>
                  </div>
                </div>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-mono font-medium text-slate-500">
                  {qc.id}
                </span>
              </div>

              {/* Overall Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1 text-xs">
                  <span className="font-semibold text-slate-700">Overall Score</span>
                  <span className="font-bold text-slate-900">{overallPct}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className={cn("h-full rounded-full", overallPct === 100 ? "bg-emerald-500" : "bg-slate-500")}
                    style={{ width: `${overallPct}%` }} />
                </div>
              </div>

              {/* Stage grid */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {stages.map((stage) => {
                  const pct = stage.total > 0 ? Math.round((stage.done / stage.total) * 100) : 0;
                  return (
                    <div key={stage.id} className="rounded border border-slate-100 bg-slate-50 p-2">
                      <p className="text-[9px] font-semibold uppercase text-slate-500 truncate mb-1" title={stage.label}>{stage.label}</p>
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 flex-1 rounded-full bg-slate-200 overflow-hidden">
                          <div className={cn("h-full rounded-full", pct === 100 ? "bg-emerald-500" : pct > 0 ? "bg-amber-400" : "")}
                            style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] font-medium text-slate-600">{stage.done}/{stage.total}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Feedback Chip */}
              <div className="mb-3">
                {feedback
                  ? <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700">
                      <Star className="h-3 w-3" />Feedback: {feedback.overallRating}/5
                    </span>
                  : <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-500">
                      <Star className="h-3 w-3 text-slate-400" />Feedback Pending
                    </span>}
              </div>

              {/* CTA */}
              <div className="mt-auto border-t border-slate-100 pt-3 flex items-center justify-end">
                <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-700 flex items-center gap-1 transition-colors">
                  Review <ChevronRight className="h-3 w-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
