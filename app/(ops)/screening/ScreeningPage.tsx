"use client";
import { useAppStore } from "@/lib/store/useAppStore";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { formatDate } from "@/lib/utils/date";

const STATUS_COLORS: Record<string, string> = {
  pending:           "bg-slate-100 text-slate-600",
  in_progress:       "bg-amber-100 text-amber-700",
  cleared:           "bg-emerald-100 text-emerald-700",
  not_cleared:       "bg-red-100 text-red-700",
  more_info_required:"bg-orange-100 text-orange-700",
};

export function ScreeningPage() {
  const { screeningRecords, patients } = useAppStore();

  return (
    <div className="space-y-5 max-w-5xl">
      <PageHeader
        title="Medical Screening"
        subtitle="Comprehensive medical review of patient history, conditions, and contraindications before treatment."
      />
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-semibold text-slate-700">{screeningRecords.length} Screening Record{screeningRecords.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="px-4 py-2 text-xs font-medium text-slate-500">Record ID</th>
                <th className="px-4 py-2 text-xs font-medium text-slate-500">Patient</th>
                <th className="px-4 py-2 text-xs font-medium text-slate-500">Status</th>
                <th className="px-4 py-2 text-xs font-medium text-slate-500">Completed</th>
                <th className="px-4 py-2 text-xs font-medium text-slate-500">Contraindications</th>
                <th className="px-4 py-2 text-xs font-medium text-slate-500">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {screeningRecords.map((rec) => {
                const patient = patients.find((p) => p.id === rec.patientId);
                return (
                  <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5 text-xs font-mono text-slate-500">{rec.id}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-800">{patient?.name ?? rec.patientId}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex rounded px-2 py-0.5 text-[11px] font-medium ${STATUS_COLORS[rec.status] ?? "bg-slate-100 text-slate-600"}`}>
                        {rec.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-500">{formatDate(rec.dateCompleted)}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-500">{rec.contraindications || "None"}</td>
                    <td className="px-4 py-2.5 max-w-[200px]">
                      <p className="truncate text-xs text-slate-600">{rec.clearanceNotes ?? "—"}</p>
                    </td>
                  </tr>
                );
              })}
              {screeningRecords.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-400">No screening records yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
        New screening record form — Phase 2
      </div>
    </div>
  );
}
