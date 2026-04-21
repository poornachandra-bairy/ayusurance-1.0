"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store/useAppStore";
import { PageHeader } from "@/app/components/shell/PageHeader";
import portalChecklist  from "@/data/portal-onboarding-checklist.json";
import waGroupConfig    from "@/data/whatsapp-group-config.json";
import { formatDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import {
  Smartphone, Search, CheckCircle2, Clock, ChevronRight,
  User, MessageSquare, ExternalLink,
} from "lucide-react";

export function PatientPortalPage() {
  const { portalOnboardingV2Records, reservationV2Records, patients } = useAppStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

  const enriched = useMemo(() =>
    portalOnboardingV2Records.map((pob) => {
      const patient = patients.find((p) => p.id === pob.patientId);
      const res     = reservationV2Records.find((r) => r.patientId === pob.patientId);
      const portalDone = portalChecklist.items.filter((i) => pob.portalItems && pob.portalItems[i.id]).length;
      const waDone     = (pob.whatsappMembers || []).filter((m) => m.added).length;
      return { pob, patient, res, portalDone, portalTotal: portalChecklist.items.length, waDone, waTotal: waGroupConfig.members.length };
    }),
    [portalOnboardingV2Records, reservationV2Records, patients]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return enriched.filter(({ pob, patient }) => {
      if (q && !patient?.name.toLowerCase().includes(q) && !pob.id.toLowerCase().includes(q)) return false;
      if (filter === "pending"   && pob.status === "completed") return false;
      if (filter === "completed" && pob.status !== "completed") return false;
      return true;
    });
  }, [enriched, search, filter]);

  const stats = {
    total:     portalOnboardingV2Records.length,
    inProg:    portalOnboardingV2Records.filter((p) => p.status !== "completed").length,
    complete:  portalOnboardingV2Records.filter((p) => p.status === "completed").length,
    waSetup:   portalOnboardingV2Records.filter((p) => p.whatsappGroupCreated).length,
  };

  return (
    <div className="space-y-5 max-w-7xl">
      <PageHeader title="Patient Portal Onboarding" subtitle="Track portal access provisioning, onboarding checklist completion, and WhatsApp coordination group setup." />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total",       value: stats.total,    Icon: Smartphone,    col: "text-slate-600",   bg: "bg-slate-100" },
          { label: "In Progress", value: stats.inProg,   Icon: Clock,         col: "text-amber-600",   bg: "bg-amber-50" },
          { label: "Completed",   value: stats.complete, Icon: CheckCircle2,  col: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "WA Set Up",   value: stats.waSetup,  Icon: MessageSquare, col: "text-blue-600",    bg: "bg-blue-50" },
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

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search patient…"
            className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 pl-8 pr-3 text-sm focus:border-slate-400 focus:bg-white focus:outline-none" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value as any)}
          className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:outline-none">
          <option value="all">All</option>
          <option value="pending">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white py-16 text-center">
          <Smartphone className="mx-auto mb-2 h-6 w-6 text-slate-300" />
          <p className="text-sm text-slate-500">No portal onboarding records yet.</p>
          <p className="mt-1 text-xs text-slate-400">Records appear automatically after the reservation fee is confirmed.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left">
                <th className="px-4 py-2.5 text-xs font-medium text-slate-500">Patient</th>
                <th className="px-4 py-2.5 text-xs font-medium text-slate-500">Record</th>
                <th className="px-4 py-2.5 text-xs font-medium text-slate-500">Portal Access</th>
                <th className="px-4 py-2.5 text-xs font-medium text-slate-500">WhatsApp</th>
                <th className="px-4 py-2.5 text-xs font-medium text-slate-500">Status</th>
                <th className="px-4 py-2.5 text-xs font-medium text-slate-500">Created</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(({ pob, patient, portalDone, portalTotal, waDone, waTotal }) => (
                <tr key={pob.id} className="group hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 shrink-0 rounded-full bg-slate-100 flex items-center justify-center">
                        <User className="h-3.5 w-3.5 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{patient?.name ?? pob.patientId}</p>
                        <p className="text-[10px] text-slate-400">{pob.patientId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{pob.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-16 rounded-full bg-slate-100 overflow-hidden">
                        <div className={cn("h-full rounded-full", portalDone === portalTotal ? "bg-emerald-500" : "bg-amber-400")}
                          style={{ width: `${portalTotal > 0 ? Math.round((portalDone / portalTotal) * 100) : 0}%` }} />
                      </div>
                      <span className="text-[11px] text-slate-500">{portalDone}/{portalTotal}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {pob.whatsappGroupCreated
                        ? <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" /> Group Created
                          </span>
                        : <span className="text-[11px] italic text-slate-400">Not created</span>}
                      <span className="text-[11px] text-slate-500">{waDone}/{waTotal} members</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex rounded border px-2 py-0.5 text-[11px] font-medium",
                      pob.status === "completed" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700")}>
                      {pob.status === "completed" ? "Complete" : "In Progress"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{formatDate(pob.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    {/* Portal records are managed from the Reservation page */}
                    <Link href={`/reservation/${pob.patientId}`}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-50">
                      Manage <ExternalLink className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-lg border border-slate-100 bg-slate-50/50 px-4 py-3 text-xs text-slate-500">
        <strong>Note:</strong> Portal access items and WhatsApp group setup are managed in the{" "}
        <Link href="/reservation" className="text-emerald-600 underline underline-offset-2 hover:text-emerald-700">
          Reservation & Orientation
        </Link>{" "}
        workspace (tabs 3 &amp; 4 within each patient record).
      </div>
    </div>
  );
}
