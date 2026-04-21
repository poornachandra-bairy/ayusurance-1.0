"use client";
import { useAppStore } from "@/lib/store/useAppStore";
import { PageHeader } from "@/app/components/shell/PageHeader";

export function ReservationPage() {
  const { reservationRecords, patients } = useAppStore();
  return (
    <div className="space-y-5 max-w-4xl">
      <PageHeader title="Reservation & Orientation" subtitle="Confirm program dates, allocate accommodation, collect deposit, and dispatch orientation kit." />
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm p-4">
        <p className="text-sm font-semibold text-slate-700 mb-3">Reservation Records ({reservationRecords.length})</p>
        {reservationRecords.length === 0 ? (
          <p className="text-sm text-slate-400">No reservations on record. Reservations are created after successful PK consultation.</p>
        ) : (
          <div className="space-y-2">{reservationRecords.map((r) => {
            const patient = patients.find((p) => p.id === r.patientId);
            return (
              <div key={r.id} className="rounded border border-slate-100 bg-slate-50 px-3 py-2">
                <p className="text-sm font-medium text-slate-800">{patient?.name ?? r.patientId}</p>
                <p className="text-xs text-slate-500">{r.id} · {r.programStartDate} → {r.programEndDate} · Status: {r.status}</p>
              </div>
            );
          })}</div>
        )}
      </div>
      <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">Reservation form & orientation kit dispatch — Phase 2</div>
    </div>
  );
}
