"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store/useAppStore";
import { PageHeader } from "@/app/components/shell/PageHeader";
import type { ReservationStatus } from "@/lib/types/reservationV2";
import ekitData from "@/data/ekit-contents.json";
import { formatDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import { CalendarCheck, Search, CheckCircle2, Clock, ChevronRight, User, DollarSign, Package, Globe } from "lucide-react";

const statusConfig: Record<ReservationStatus, { label: string; cls: string }> = {
  pending_payment:     { label: "Pending Payment",     cls: "bg-amber-50 text-amber-700 border-amber-200" },
  payment_received:    { label: "Payment Received",    cls: "bg-blue-50 text-blue-700 border-blue-200" },
  ekit_dispatched:     { label: "e-Kit Dispatched",    cls: "bg-violet-50 text-violet-700 border-violet-200" },
  onboarding_complete: { label: "Onboarding Complete", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

export function ReservationQueuePage() {
  const { reservationV2Records, portalOnboardingV2Records, patients, pracharakas } = useAppStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | "all">("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const enriched = useMemo(() =>
    reservationV2Records.map((res) => {
      const patient = patients.find((p) => p.id === res.patientId);
      const pr = pracharakas.find((p) => p.id === patient?.pracharakaId);
      const pob = portalOnboardingV2Records.find((p) => p.patientId === res.patientId);
      const applicable = ekitData.items.filter((i) => !i.internationalOnly || res.isInternationalPatient).length;
      const dispatched = (res.ekitItems || []).filter((i) => i.dispatched).length;
      return { res, patient, pr, pob, ekitPct: applicable > 0 ? Math.round((dispatched / applicable) * 100) : 0 };
    }),
    [reservationV2Records, patients, pracharakas, portalOnboardingV2Records]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return enriched.filter(({ res, patient }) => {
      if (q && !patient?.name.toLowerCase().includes(q) && !res.id.toLowerCase().includes(q)) return false;
      if (statusFilter !== "all" && res.status !== statusFilter) return false;
      return true;
    });
  }, [enriched, search, statusFilter]);

  const stats = {
    total:    reservationV2Records.length,
    pending:  reservationV2Records.filter((r) => !r.feePaid).length,
    paid:     reservationV2Records.filter((r) => r.feePaid).length,
    complete: portalOnboardingV2Records.filter((p) => p.status === "completed").length,
  };

  return (
    <div className="space-y-5 max-w-7xl">
      <PageHeader title="Reservation & Orientation" subtitle="Track reservation fees, e-Kit dispatch, portal onboarding, and WhatsApp group setup." />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total",     value: stats.total,    Icon: CalendarCheck, col: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Pending",   value: stats.pending,  Icon: Clock,         col: "text-amber-600",   bg: "bg-amber-50" },
          { label: "Fee Paid",  value: stats.paid,     Icon: DollarSign,    col: "text-blue-600",    bg: "bg-blue-50" },
          { label: "Onboarded", value: stats.complete, Icon: CheckCircle2,  col: "text-violet-600",  bg: "bg-violet-50" },
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
            className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 pl-8 pr-3 text-sm text-slate-700 focus:border-emerald-400 focus:bg-white focus:outline-none" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}
          className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:border-emerald-400 focus:outline-none">
          <option value="all">All Statuses</option>
          {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white py-16 text-center">
          <CalendarCheck className="mx-auto mb-2 h-6 w-6 text-slate-300" />
          <p className="text-sm text-slate-500">No reservation records yet.</p>
          <p className="mt-1 text-xs text-slate-400">Records appear after PK Consultation is marked complete.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(({ res, patient, pob, ekitPct }) => {
            const st = statusConfig[res.status];

            return (
              <Link 
                key={res.id} 
                href={`/reservation/${res.patientId}`}
                className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex flex-col"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-700">
                      {patient?.name.slice(0, 2).toUpperCase() ?? "??"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{patient?.name ?? res.patientId}</p>
                      <p className="text-[10px] text-slate-400">{res.patientId}</p>
                    </div>
                  </div>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-mono font-medium text-slate-500">
                    {res.id}
                  </span>
                </div>

                {/* Info grid */}
                <div className="space-y-1.5 mb-3 flex-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Patient Type</span>
                    {res.isInternationalPatient
                      ? <span className="inline-flex items-center gap-1 rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] text-blue-700"><Globe className="h-3 w-3" /> Intl.</span>
                      : <span className="font-medium text-slate-700">Domestic</span>}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Reservation Fee</span>
                    <span className={cn("inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-medium",
                      res.feePaid ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500")}>
                      <DollarSign className="h-3 w-3" />$300 {res.feePaid ? "✓" : "Pending"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">e-Kit Disp.</span>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-14 rounded-full bg-slate-100 overflow-hidden">
                        <div className={cn("h-full rounded-full", ekitPct === 100 ? "bg-emerald-500" : "bg-amber-400")} style={{ width: `${ekitPct}%` }} />
                      </div>
                      <span className="text-[11px] font-medium text-slate-700">{ekitPct}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Portal Onboarded</span>
                    <span className={cn("inline-flex rounded border px-2 py-0.5 text-[10px] font-medium",
                      pob?.status === "completed" ? "border-emerald-200 bg-emerald-50 text-emerald-700" :
                      pob ? "border-amber-200 bg-amber-50 text-amber-700" : "border-slate-200 bg-slate-50 text-slate-400")}>
                      {pob?.status === "completed" ? "Complete" : pob ? "In Progress" : "Not Started"}
                    </span>
                  </div>
                </div>

                {/* Status chips */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium", st.cls)}>
                    {st.label}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                    {formatDate(res.createdAt)}
                  </span>
                </div>

                {/* CTA */}
                <div className="mt-auto border-t border-slate-100 pt-3 flex items-center justify-end">
                  <span className="text-[11px] font-medium text-slate-400 group-hover:text-emerald-600 flex items-center gap-1 transition-colors">
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
