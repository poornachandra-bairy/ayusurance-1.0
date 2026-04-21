"use client";
import { useAppStore } from "@/lib/store/useAppStore";
import { PageHeader } from "@/app/components/shell/PageHeader";

export function TravelPaymentPage() {
  const { travelPaymentRecords, patients } = useAppStore();
  return (
    <div className="space-y-5 max-w-4xl">
      <PageHeader title="Travel & Payment" subtitle="Confirm travel itineraries, collect balance program fees, and arrange centre pickup." />
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm p-4">
        <p className="text-sm font-semibold text-slate-700 mb-3">Travel & Payment Records ({travelPaymentRecords.length})</p>
        {travelPaymentRecords.length === 0 ? (
          <p className="text-sm text-slate-400">No travel/payment records. Created after patient portal onboarding is complete.</p>
        ) : (
          <div className="space-y-2">{travelPaymentRecords.map((r) => {
            const patient = patients.find((p) => p.id === r.patientId);
            return (
              <div key={r.id} className="rounded border border-slate-100 bg-slate-50 px-3 py-2">
                <p className="text-sm font-medium text-slate-800">{patient?.name ?? r.patientId}</p>
                <p className="text-xs text-slate-500">{r.id} · Payment: {r.paymentStatus} · Total: ₹{r.totalAmountINR?.toLocaleString("en-IN")}</p>
              </div>
            );
          })}</div>
        )}
      </div>
      <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">Travel details & payment collection form — Phase 2</div>
    </div>
  );
}
