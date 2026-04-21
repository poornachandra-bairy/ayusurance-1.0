"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store/useAppStore";
import { useRole } from "@/lib/context/RoleContext";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { formatDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import {
  Syringe, Search, User, ArrowRight, Clock, CheckCircle2,
  CalendarDays, Shield, Star,
} from "lucide-react";

export function ActiveTreatmentPage() {
  const {
    patients, pracharakas, arrivalAdmissionRecords,
    treatmentPlanV2Records, qualityChecklists, feedbackRecords,
  } = useAppStore();
  const { role } = useRole();
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const admitted = useMemo(() =>
    arrivalAdmissionRecords
      .filter((a) => a.isAdmitted)
      .map((a) => {
        const patient = patients.find((p) => p.id === a.patientId);
        const pr      = pracharakas.find((p) => p.id === patient?.pracharakaId);
        const plan    = treatmentPlanV2Records.find((t) => t.patientId === a.patientId);
        const qc      = qualityChecklists.find((q) => q.patientId === a.patientId);
        const fb      = feedbackRecords.find((f) => f.patientId === a.patientId);
        const daysSince = a.admittedAt
          ? Math.max(0, Math.floor((Date.now() - new Date(a.admittedAt).getTime()) / 86_400_000))
          : 0;
        return { a, patient, pr, plan, qc, fb, daysSince };
      })
      .filter(({ patient }) => !search || patient?.name.toLowerCase().includes(search.toLowerCase())),
    [arrivalAdmissionRecords, patients, pracharakas, treatmentPlanV2Records, qualityChecklists, feedbackRecords, search]
  );

  if (!mounted) return null;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Active Treatment"
        subtitle={`${admitted.length} patient${admitted.length !== 1 ? "s" : ""} currently in Panchakarma program`}
      />

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search patient…"
          className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 pl-8 pr-3 text-sm focus:border-slate-400 focus:bg-white focus:outline-none" />
      </div>

      {admitted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white py-20 text-center">
          <Syringe className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <p className="text-sm font-medium text-slate-500">No patients currently in active treatment.</p>
          <p className="mt-1 text-xs text-slate-400">Patients appear here after the ACO completes admission in the Travel &amp; Payment workspace.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {admitted.map(({ a, patient, pr, plan, qc, fb, daysSince }) => (
            <Link key={a.patientId} href={`/active-treatment/${a.patientId}`}
              className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-rose-200 transition-all">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-rose-100 flex items-center justify-center text-sm font-bold text-rose-700">
                    {patient?.name.slice(0, 2).toUpperCase() ?? "??"}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{patient?.name ?? a.patientId}</p>
                    <p className="text-[10px] text-slate-400">{a.patientId}</p>
                  </div>
                </div>
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                  Day {daysSince + 1}
                </span>
              </div>

              {/* Info grid */}
              <div className="space-y-1.5 mb-3">
                {[
                  { label: "PK Type", value: plan?.protocol?.panchakarmaType || "—" },
                  { label: "Duration", value: plan?.protocol?.therapyDuration || "—" },
                  { label: "Pracharaka", value: pr?.name || "—" },
                  { label: "Admitted", value: a.admittedAt ? formatDate(a.admittedAt) : "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">{label}</span>
                    <span className="font-medium text-slate-700 text-right max-w-[55%] truncate">{value}</span>
                  </div>
                ))}
              </div>

              {/* Status chips */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                  qc ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500")}>
                  <Shield className="h-2.5 w-2.5" />{qc ? "QC Active" : "QC Pending"}
                </span>
                <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                  fb ? "border-amber-200 bg-amber-50 text-amber-700" : "border-slate-200 bg-slate-50 text-slate-500")}>
                  <Star className="h-2.5 w-2.5" />{fb ? "Feedback Done" : "Await Feedback"}
                </span>
              </div>

              {/* Day tracker bar */}
              <div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span>Day {daysSince + 1}</span>
                  <span>{plan?.protocol?.therapyDuration || "?"}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-rose-400" style={{ width: "35%" }} />
                </div>
              </div>

              <div className="mt-3 flex items-center justify-end">
                <span className="text-[11px] font-medium text-slate-400 group-hover:text-rose-600 flex items-center gap-1 transition-colors">
                  Open workspace <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
