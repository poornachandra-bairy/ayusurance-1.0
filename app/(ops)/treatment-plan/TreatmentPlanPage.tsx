"use client";
import { useAppStore } from "@/lib/store/useAppStore";
import { PageHeader } from "@/app/components/shell/PageHeader";

export function TreatmentPlanPage() {
  const { treatmentPlans, patients } = useAppStore();
  return (
    <div className="space-y-5 max-w-4xl">
      <PageHeader title="Treatment Plan" subtitle="Ayurveda doctor-formulated personalised Panchakarma treatment protocols." />
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm p-4">
        <p className="text-sm font-semibold text-slate-700 mb-3">Treatment Plans ({treatmentPlans.length})</p>
        {treatmentPlans.length === 0 ? (
          <p className="text-sm text-slate-400">No treatment plans on record. Plans are created after medical screening clearance.</p>
        ) : (
          <div className="space-y-2">{treatmentPlans.map((tp) => {
            const patient = patients.find((p) => p.id === tp.patientId);
            return (
              <div key={tp.id} className="rounded border border-slate-100 bg-slate-50 px-3 py-2">
                <p className="text-sm font-medium text-slate-800">{patient?.name ?? tp.patientId}</p>
                <p className="text-xs text-slate-500">{tp.id} · {tp.programDurationDays} days · Status: {tp.status}</p>
              </div>
            );
          })}</div>
        )}
      </div>
      <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">Treatment plan builder form — Phase 2</div>
    </div>
  );
}
