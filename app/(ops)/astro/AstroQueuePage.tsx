"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store/useAppStore";
import { PageHeader } from "@/app/components/shell/PageHeader";
import type { AstroDecision, AstroStatus } from "@/lib/types/astroV2";
import { formatDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import {
  Star,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  User,
  Layers,
} from "lucide-react";

const decisionBadge: Record<AstroDecision, { label: string; cls: string }> = {
  pending:                  { label: "Pending",                 cls: "bg-slate-100 text-slate-700 border-slate-200" },
  requires_review:          { label: "Requires Review",         cls: "bg-amber-50 text-amber-700 border-amber-200" },
  eligible:                 { label: "Eligible",                cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  not_immediately_eligible: { label: "Not Immediately Eligible",cls: "bg-rose-50 text-rose-700 border-rose-200" },
};

const statusBadge: Record<AstroStatus, { label: string; icon: React.ElementType }> = {
  pending_preparation:  { label: "Pending Preparation", icon: Clock },
  analysis_in_progress: { label: "Analysis In Progress", icon: Layers },
  evaluation_completed: { label: "Evaluation Completed", icon: CheckCircle2 },
};

export function AstroQueuePage() {
  const { astroEligibilityV2Entries, patients, wishListV2Entries, pracharakas } = useAppStore();

  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusFilter] = useState<AstroStatus | "all">("all");
  const [decisionFilter, setDecisionFilter] = useState<AstroDecision | "all">("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const enriched = useMemo(() =>
    astroEligibilityV2Entries.map((ae) => {
      const patient  = patients.find((p) => p.id === ae.patientId);
      const wishList = wishListV2Entries.find((wl) => wl.id === ae.wishListId);
      const pr       = pracharakas.find((p) => p.id === wishList?.pracharakaId);
      return { ae, patient, wishList, pr };
    }),
    [astroEligibilityV2Entries, patients, wishListV2Entries, pracharakas]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return enriched.filter(({ ae, patient }) => {
      if (q && !patient?.name.toLowerCase().includes(q) && !ae.id.toLowerCase().includes(q)) return false;
      if (statusFilter !== "all" && ae.status !== statusFilter) return false;
      if (decisionFilter !== "all" && ae.decision !== decisionFilter) return false;
      return true;
    });
  }, [enriched, search, statusFilter, decisionFilter]);

  const stats = {
    total:     astroEligibilityV2Entries.length,
    pending:   astroEligibilityV2Entries.filter((a) => a.status !== "evaluation_completed").length,
    eligible:  astroEligibilityV2Entries.filter((a) => a.decision === "eligible").length,
    deferred:  astroEligibilityV2Entries.filter((a) => a.decision === "not_immediately_eligible").length,
  };

  return (
    <div className="space-y-5 max-w-7xl">
      <PageHeader
        title="Astrochart Eligibility Queue"
        subtitle="Jyotish-based health assessments to determine ideal Panchakarma timing for forwarded patients."
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Evaluations", value: stats.total,    icon: Star,         col: "text-violet-600", bg: "bg-violet-50" },
          { label: "Pending / In Progress", value: stats.pending,  icon: Clock,        col: "text-amber-600",  bg: "bg-amber-50" },
          { label: "Eligible",          value: stats.eligible, icon: CheckCircle2, col: "text-emerald-600",bg: "bg-emerald-50" },
          { label: "Deferred",          value: stats.deferred, icon: AlertCircle,  col: "text-rose-600",   bg: "bg-rose-50" },
        ].map(({ label, value, icon: Icon, col, bg }) => (
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
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patient name or record ID…"
              className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 pl-8 pr-3 text-sm text-slate-700 focus:border-violet-400 focus:bg-white focus:outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:border-violet-400 focus:outline-none"
          >
            <option value="all">All Stages</option>
            <option value="pending_preparation">Pending Preparation</option>
            <option value="analysis_in_progress">Analysis In Progress</option>
            <option value="evaluation_completed">Evaluation Completed</option>
          </select>
          <select
            value={decisionFilter}
            onChange={(e) => setDecisionFilter(e.target.value as any)}
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:border-violet-400 focus:outline-none"
          >
            <option value="all">All Decisions</option>
            <option value="pending">Pending</option>
            <option value="requires_review">Requires Review</option>
            <option value="eligible">Eligible</option>
            <option value="not_immediately_eligible">Not Immediately Eligible</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white py-16 text-center">
          <Star className="mx-auto mb-2 h-6 w-6 text-slate-300" />
          <p className="text-sm text-slate-500">No astrochart evaluations found.</p>
          <p className="mt-1 text-xs text-slate-400">
            Forward a verified Wish List from the Wish List section to begin an evaluation.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(({ ae, patient, pr }, idx) => {
            const status  = statusBadge[ae.status];
            const decision = decisionBadge[ae.decision];
            const StatusIcon = status.icon;
            
            return (
              <Link 
                key={`${ae.id}-${idx}`} 
                href={`/astro/${ae.patientId}`}
                className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-violet-300 transition-all flex flex-col"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-violet-100 flex items-center justify-center text-sm font-bold text-violet-700">
                      {patient?.name.slice(0, 2).toUpperCase() ?? "??"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{patient?.name ?? ae.patientId}</p>
                      <p className="text-[10px] text-slate-400">{ae.patientId}</p>
                    </div>
                  </div>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-mono font-medium text-slate-500">
                    {ae.id}
                  </span>
                </div>

                {/* Info grid */}
                <div className="space-y-1.5 mb-3 flex-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Pracharaka</span>
                    <span className="font-medium text-slate-700 truncate max-w-[60%]">{pr?.name ?? "—"}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Created</span>
                    <span className="font-medium text-slate-700">{formatDate(ae.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Comms Sent</span>
                    <span className="font-medium text-slate-700">{(ae.communications || []).length} / 4</span>
                  </div>
                </div>

                {/* Status chips */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                    <StatusIcon className="h-2.5 w-2.5" />
                    {status.label}
                  </span>
                  <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium", decision.cls)}>
                    {decision.label}
                  </span>
                </div>

                {/* CTA */}
                <div className="mt-auto border-t border-slate-100 pt-3 flex items-center justify-end">
                  <span className="text-[11px] font-medium text-slate-400 group-hover:text-violet-600 flex items-center gap-1 transition-colors">
                    Evaluate <ChevronRight className="h-3 w-3" />
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
