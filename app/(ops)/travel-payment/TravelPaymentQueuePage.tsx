"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store/useAppStore";
import { PageHeader } from "@/app/components/shell/PageHeader";
import travelTasks from "@/data/travel-tasks.json";
import { formatDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import { Plane, Search, CheckCircle2, Clock, ChevronRight, User, DollarSign, CreditCard, LogIn, Globe } from "lucide-react";

export function TravelPaymentQueuePage() {
  const { travelPrepRecords, paymentRecords, arrivalAdmissionRecords, patients, pracharakas, reservationV2Records } = useAppStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "travel" | "payment" | "admitted">("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const enriched = useMemo(() =>
    travelPrepRecords.map((trv) => {
      const patient = patients.find((p) => p.id === trv.patientId);
      const pr      = pracharakas.find((p) => p.id === patient?.pracharakaId);
      const pay     = paymentRecords.find((p) => p.patientId === trv.patientId);
      const adm     = arrivalAdmissionRecords.find((a) => a.patientId === trv.patientId);
      const res     = reservationV2Records.find((r) => r.patientId === trv.patientId);
      const trvDone = (trv.tasks || []).filter((t) => t.done).length;
      const trvPct  = travelTasks.tasks.length > 0 ? Math.round((trvDone / travelTasks.tasks.length) * 100) : 0;
      return { trv, pay, adm, res, patient, pr, trvPct };
    }),
    [travelPrepRecords, paymentRecords, arrivalAdmissionRecords, patients, pracharakas, reservationV2Records]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return enriched.filter(({ trv, patient }) => {
      if (q && !patient?.name.toLowerCase().includes(q) && !trv.id.toLowerCase().includes(q)) return false;
      if (filter === "travel"   && trv.isComplete) return false;
      if (filter === "payment"  && !(trv.isComplete && !trv.isComplete)) return false; // show incomplete payment
      if (filter === "admitted" && !trv.isComplete) return false;
      return true;
    });
  }, [enriched, search, filter]);

  const stats = {
    total:   travelPrepRecords.length,
    inPrep:  travelPrepRecords.filter((t) => !t.isComplete).length,
    paid:    paymentRecords.filter((p) => p.advancePaid && p.finalPaid).length,
    admitted:arrivalAdmissionRecords.filter((a) => a.isAdmitted).length,
  };

  return (
    <div className="space-y-5 max-w-7xl">
      <PageHeader title="Travel & Payment" subtitle="Track travel preparation, advance and final payments, arrival admission, and required documents." />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total",     value: stats.total,    Icon: Plane,       col: "text-slate-600",   bg: "bg-slate-100" },
          { label: "In Prep",   value: stats.inPrep,   Icon: Clock,       col: "text-amber-600",   bg: "bg-amber-50" },
          { label: "Fully Paid",value: stats.paid,     Icon: CreditCard,  col: "text-blue-600",    bg: "bg-blue-50" },
          { label: "Admitted",  value: stats.admitted, Icon: LogIn,       col: "text-emerald-600", bg: "bg-emerald-50" },
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
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search patient…"
            className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 pl-8 pr-3 text-sm text-slate-700 focus:border-slate-400 focus:bg-white focus:outline-none" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value as any)}
          className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:outline-none">
          <option value="all">All</option>
          <option value="travel">In Travel Prep</option>
          <option value="admitted">Admitted</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white py-16 text-center">
          <Plane className="mx-auto mb-2 h-6 w-6 text-slate-300" />
          <p className="text-sm text-slate-500">No travel records yet.</p>
          <p className="mt-1 text-xs text-slate-400">Records appear after portal onboarding is completed.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(({ trv, pay, adm, res, patient, trvPct }) => (
            <Link 
              key={trv.id} 
              href={`/travel-payment/${trv.patientId}`}
              className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-slate-400 transition-all flex flex-col"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-700">
                    {patient?.name.slice(0, 2).toUpperCase() ?? "??"}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{patient?.name ?? trv.patientId}</p>
                    <p className="text-[10px] text-slate-400">{trv.patientId}</p>
                  </div>
                </div>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-mono font-medium text-slate-500">
                  {trv.id}
                </span>
              </div>

              {/* Info grid */}
              <div className="space-y-1.5 mb-3 flex-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Patient Type</span>
                  {res?.isInternationalPatient
                    ? <span className="inline-flex items-center gap-1 rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] text-blue-700"><Globe className="h-3 w-3" /> Intl.</span>
                    : <span className="font-medium text-slate-700">Domestic</span>}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Arrival Date</span>
                  <span className="font-medium text-slate-700">{trv.arrivalDate ? formatDate(trv.arrivalDate) : <span className="text-slate-400 italic">TBC</span>}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Travel Prep.</span>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-14 rounded-full bg-slate-100 overflow-hidden">
                      <div className={cn("h-full rounded-full", trvPct === 100 ? "bg-emerald-500" : "bg-amber-400")} style={{ width: `${trvPct}%` }} />
                    </div>
                    <span className="text-[11px] font-medium text-slate-700">{trvPct}%</span>
                  </div>
                </div>
              </div>

              {/* Status chips */}
              <div className="grid grid-cols-3 gap-1.5 mb-3">
                <span className={cn("inline-flex justify-center items-center gap-1 rounded border px-2 py-1 text-[10px] font-medium",
                  pay?.advancePaid ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500")}>
                  <DollarSign className="h-3 w-3" />Adv.
                </span>
                <span className={cn("inline-flex justify-center items-center gap-1 rounded border px-2 py-1 text-[10px] font-medium",
                  pay?.finalPaid ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500")}>
                  <CreditCard className="h-3 w-3" />Final
                </span>
                <span className={cn("inline-flex justify-center items-center gap-1 rounded border px-2 py-1 text-[10px] font-medium",
                  adm?.isAdmitted ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500")}>
                  <LogIn className="h-3 w-3" />Adm.
                </span>
              </div>

              {/* CTA */}
              <div className="mt-auto border-t border-slate-100 pt-3 flex items-center justify-end">
                <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-700 flex items-center gap-1 transition-colors">
                  Open <ChevronRight className="h-3 w-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
