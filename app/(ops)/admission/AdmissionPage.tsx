"use client";
import { useAppStore } from "@/lib/store/useAppStore";
import { PageHeader } from "@/app/components/shell/PageHeader";

export function AdmissionPage() {
  const { admissionRecords, patients } = useAppStore();
  return (
    <div className="space-y-5 max-w-4xl">
      <PageHeader title="Arrival & Admission" subtitle="Patient arrival at the Panchakarma centre, formal admission, and commencement of Poorvakarma." />
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm p-4">
        <p className="text-sm font-semibold text-slate-700 mb-3">Admission Records ({admissionRecords.length})</p>
        {admissionRecords.length === 0 ? (
          <p className="text-sm text-slate-400">No admission records. Patients currently in the admission stage will appear here.</p>
        ) : (
          <div className="space-y-2">{admissionRecords.map((r) => {
            const patient = patients.find((p) => p.id === r.patientId);
            return (
              <div key={r.id} className="rounded border border-slate-100 bg-slate-50 px-3 py-2">
                <p className="text-sm font-medium text-slate-800">{patient?.name ?? r.patientId}</p>
                <p className="text-xs text-slate-500">{r.id} · Status: {r.status} · Room: {r.roomNumber ?? "—"}</p>
              </div>
            );
          })}</div>
        )}
      </div>
      <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">Admission form & programme management — Phase 2</div>
    </div>
  );
}
