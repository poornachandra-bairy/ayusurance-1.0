"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAppStore } from "@/lib/store/useAppStore";
import { PageHeader } from "@/app/components/shell/PageHeader";
import type { TreatmentPlanV2Status, MedicineEntry, MedicineCategoryId } from "@/lib/types/treatmentV2";
import protocolSections from "@/data/treatment-protocol-sections.json";
import medicineCats     from "@/data/treatment-medicine-categories.json";
import scheduleTargets  from "@/data/treatment-schedule-targets.json";
import { formatDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import {
  ArrowLeft, FileText, FlaskConical, CalendarCheck,
  CheckCircle2, Save, Send, Plus, X, Share2, Truck,
} from "lucide-react";

const inputCls = "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400";

function Section({ title, icon: Icon, children, accent = false }: {
  title: string; icon: React.ElementType; children: React.ReactNode; accent?: boolean;
}) {
  return (
    <section className={cn("rounded-lg border bg-white shadow-sm overflow-hidden", accent ? "border-indigo-200" : "border-slate-200")}>
      <div className={cn("flex items-center gap-2 border-b px-5 py-3", accent ? "border-indigo-100 bg-indigo-50/60" : "border-slate-100 bg-slate-50/50")}>
        <Icon className={cn("h-4 w-4", accent ? "text-indigo-500" : "text-slate-400")} />
        <h2 className={cn("text-sm font-semibold", accent ? "text-indigo-800" : "text-slate-800")}>{title}</h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-0.5">{label}</p>
      <p className={cn("text-sm text-slate-800", !value && "italic text-slate-400")}>{value || "—"}</p>
    </div>
  );
}

export function TreatmentPlanDetailPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const {
    treatmentPlanV2ByPatientId, screeningV2ByPatientId,
    patients, pracharakas, workflowRecordByPatientId,
    initiateTreatmentPlan, updateTreatmentPlanV2, approveTreatmentPlan,
  } = useAppStore();

  const patient   = patients.find((p) => p.id === patientId);
  const pr        = pracharakas.find((p) => p.id === patient?.pracharakaId);
  const screening = screeningV2ByPatientId(patientId);
  const wfRecord  = workflowRecordByPatientId(patientId);

  useEffect(() => {
    if (patient && screening && !treatmentPlanV2ByPatientId(patientId)) {
      initiateTreatmentPlan(patientId, screening.id);
    }
  }, [patient, screening, patientId]);

  const plan = treatmentPlanV2ByPatientId(patientId);

  const [protocol,       setProtocol]       = useState<Record<string, string>>(plan?.protocol ?? {});
  const [status,         setStatus]         = useState<TreatmentPlanV2Status>(plan?.status ?? "draft");
  const [vaidyaName,     setVaidyaName]     = useState(plan?.treatingVaidyaName ?? "");
  const [scheduleShares, setScheduleShares] = useState(plan?.scheduleShares ?? scheduleTargets.targets.map((t) => ({ target: t.id as any, shared: false })));
  const [medicineCategories, setMedicineCategories] = useState(plan?.medicineCategories ?? medicineCats.categories.map((c) => ({
    categoryId: c.id as MedicineCategoryId,
    medicines: [] as MedicineEntry[],
    pharmacyForwarded: false, pharmacyForwardedAt: undefined,
    shippingRequired: false,  shippingForwarded: false, shippingForwardedAt: undefined,
  })));
  const [saved, setSaved] = useState(false);

  const approved = plan?.status === "approved";

  useEffect(() => {
    if (plan) {
      setProtocol(plan.protocol);
      setStatus(plan.status);
      setVaidyaName(plan.treatingVaidyaName ?? "");
      setScheduleShares(plan.scheduleShares ?? scheduleTargets.targets.map((t) => ({ target: t.id as any, shared: false })));
      setMedicineCategories(plan.medicineCategories ?? medicineCats.categories.map((c) => ({
        categoryId: c.id as MedicineCategoryId,
        medicines: [] as MedicineEntry[],
        pharmacyForwarded: false, pharmacyForwardedAt: undefined,
        shippingRequired: false,  shippingForwarded: false, shippingForwardedAt: undefined,
      })));
    }
  }, [plan?.id]);

  if (!patient || !plan) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FileText className="mb-3 h-10 w-10 text-slate-300" />
        <p className="text-sm text-slate-600">Treatment plan loading…</p>
        <Link href="/treatment-plan" className="mt-4 text-xs text-indigo-600 hover:underline flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" /> Back to Queue
        </Link>
      </div>
    );
  }

  function handleSave() {
    if (!plan) return;
    updateTreatmentPlanV2(plan.id, { protocol, status, treatingVaidyaName: vaidyaName, scheduleShares, medicineCategories });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleApprove() {
    handleSave();
    approveTreatmentPlan(plan!.id);
  }

  function addMedicine(catIdx: number) {
    const name = prompt("Medicine name:");
    if (!name) return;
    const dosage    = prompt("Dosage (optional):") ?? "";
    const frequency = prompt("Frequency (optional):") ?? "";
    const duration  = prompt("Duration (optional):") ?? "";
    setMedicineCategories((prev) => prev.map((cat, i) =>
      i !== catIdx ? cat : {
        ...cat,
        medicines: [...cat.medicines, { id: Date.now().toString(), name, dosage, frequency, duration }],
      }
    ));
  }

  function removeMedicine(catIdx: number, medId: string) {
    setMedicineCategories((prev) => prev.map((cat, i) =>
      i !== catIdx ? cat : { ...cat, medicines: cat.medicines.filter((m) => m.id !== medId) }
    ));
  }

  function toggleShare(idx: number) {
    setScheduleShares((prev) => prev.map((s, i) =>
      i !== idx ? s : { ...s, shared: !s.shared, sharedAt: !s.shared ? new Date().toISOString() : undefined }
    ));
  }

  function toggleForwarding(catIdx: number, field: "pharmacyForwarded" | "shippingForwarded") {
    setMedicineCategories((prev) => prev.map((cat, i) =>
      i !== catIdx ? cat
        : { ...cat, [field]: !cat[field], [`${field.replace("Forwarded", "")}ForwardedAt`]: !cat[field] ? new Date().toISOString() : undefined }
    ));
  }

  const protocolFilled = protocolSections.sections.filter((s) => !!(protocol[s.id] ?? "").trim()).length;
  const pct = Math.round((protocolFilled / protocolSections.sections.length) * 100);

  return (
    <div className="max-w-4xl space-y-5 pb-16">
      <Link href="/treatment-plan" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-3.5 w-3.5" /> Treatment Plans
      </Link>

      <PageHeader title={`Treatment Plan — ${patient.name}`} subtitle={`Record ${plan.id} · Treating Vaidya: ${vaidyaName || "Not Assigned"}`} />

      {/* Status Banner */}
      <div className={cn("flex flex-wrap items-center gap-3 rounded-lg border px-5 py-3", approved ? "border-emerald-200 bg-emerald-50" : "border-indigo-200 bg-indigo-50")}>
        <span className="text-xs font-medium text-slate-600">Protocol: <span className="font-bold text-indigo-700">{pct}%</span> complete</span>
        <div className="h-1.5 w-24 rounded-full bg-slate-200 overflow-hidden">
          <div className={cn("h-full rounded-full", pct === 100 ? "bg-emerald-500" : "bg-indigo-400")} style={{ width: `${pct}%` }} />
        </div>
        {approved && (
          <Link
            href={`/pk-consultation/${patientId}`}
            className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline"
          >
            ✓ Approved — Open PK Consultation →
          </Link>
        )}
      </div>

      {/* Context */}
      <Section title="Patient Context" icon={FileText}>
        <div className="grid gap-3 sm:grid-cols-3">
          <Info label="Patient"        value={patient.name} />
          <Info label="Pracharaka"     value={pr?.name} />
          <Info label="Screening"      value={screening?.id} />
          <Info label="Workflow Stage" value={wfRecord?.currentWorkflowStageId?.replace(/_/g, " ")} />
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Treating Vaidya</label>
            <input value={vaidyaName} onChange={(e) => setVaidyaName(e.target.value)} disabled={approved} placeholder="Treating Vaidya name…" className={inputCls} />
          </div>
        </div>
      </Section>

      {/* Treatment Protocol */}
      <Section title="Treatment Protocol" icon={FileText} accent>
        <div className="space-y-4">
          {protocolSections.sections.map((sec) => (
            <div key={sec.id}>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {sec.label}
                <span className="ml-1 normal-case font-normal text-slate-400">— {sec.description}</span>
              </label>
              {sec.type === "textarea" ? (
                <textarea value={protocol[sec.id] ?? ""} onChange={(e) => setProtocol((p) => ({ ...p, [sec.id]: e.target.value }))}
                  disabled={approved} rows={3} placeholder={`Enter ${sec.label.toLowerCase()}…`} className={cn(inputCls, "resize-none")} />
              ) : (
                <input type="text" value={protocol[sec.id] ?? ""} onChange={(e) => setProtocol((p) => ({ ...p, [sec.id]: e.target.value }))}
                  disabled={approved} placeholder={`Enter ${sec.label.toLowerCase()}…`} className={inputCls} />
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* Therapy Schedule Distribution */}
      <Section title="Therapy Schedule — Distribution" icon={Share2}>
        <p className="mb-3 text-xs text-slate-500">Mark therapy schedule as shared with each required stakeholder.</p>
        <div className="space-y-2">
          {scheduleTargets.targets.map((target, idx) => {
            const share = (scheduleShares || []).find((s) => s.target === target.id);
            return (
              <button key={target.id} type="button" onClick={() => !approved && toggleShare(idx)}
                className={cn("flex w-full items-center justify-between rounded-md border px-4 py-2.5 text-left text-sm transition-all",
                  share?.shared ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50",
                  approved && "cursor-default"
                )}>
                <div className="flex items-center gap-3">
                  <div className={cn("h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center",
                    share?.shared ? "border-emerald-500 bg-emerald-500" : "border-slate-300")}>
                    {share?.shared && <CheckCircle2 className="h-3 w-3 text-white" />}
                  </div>
                  <div>
                    <p className={cn("font-medium text-sm", share?.shared ? "text-emerald-800" : "text-slate-700")}>{target.label}</p>
                    <p className="text-[11px] text-slate-400">{target.description}</p>
                  </div>
                </div>
                {share?.sharedAt && <span className="text-[10px] text-emerald-600">Shared {formatDate(share.sharedAt)}</span>}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Medicine Lists */}
      <Section title="Medicine Lists" icon={FlaskConical}>
        <div className="space-y-5">
          {medicineCats.categories.map((cat, catIdx) => {
            const catData = (medicineCategories || []).find((m) => m.categoryId === cat.id) ?? medicineCategories[catIdx];
            const localIdx = medicineCategories.findIndex((m) => m.categoryId === cat.id);
            return (
              <div key={cat.id} className="rounded-md border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{cat.label}</p>
                    <p className="text-[11px] text-slate-400">{cat.description}</p>
                  </div>
                  {!approved && (
                    <button onClick={() => addMedicine(localIdx)}
                      className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-700 hover:bg-indigo-100">
                      <Plus className="h-3 w-3" /> Add Medicine
                    </button>
                  )}
                </div>

                {catData?.medicines.length === 0 ? (
                  <p className="text-xs italic text-slate-400">No medicines added yet.</p>
                ) : (
                  <div className="mb-3 space-y-1.5">
                    {catData?.medicines.map((med) => (
                      <div key={med.id} className="flex items-center justify-between rounded border border-slate-100 bg-slate-50 px-3 py-2">
                        <div>
                          <span className="text-sm font-medium text-slate-800">{med.name}</span>
                          {med.dosage    && <span className="ml-2 text-[11px] text-slate-500">{med.dosage}</span>}
                          {med.frequency && <span className="ml-2 text-[11px] text-slate-400">· {med.frequency}</span>}
                          {med.duration  && <span className="ml-2 text-[11px] text-slate-400">· {med.duration}</span>}
                        </div>
                        {!approved && (
                          <button onClick={() => removeMedicine(localIdx, med.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Forwarding */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {medicineCats.forwardingTargets.map((ft) => {
                    const isShipping = ft.id === "shipping";
                    const forwarded  = isShipping ? catData?.shippingForwarded : catData?.pharmacyForwarded;
                    const fieldName  = isShipping ? "shippingForwarded" : "pharmacyForwarded" as const;
                    return (
                      <button key={ft.id} type="button" onClick={() => !approved && toggleForwarding(localIdx, fieldName)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-[11px] font-medium transition-all",
                          forwarded ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                          approved && "cursor-default"
                        )}>
                        <Truck className="h-3 w-3" />
                        {forwarded ? "✓ " : ""}{ft.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Sticky Action Bar */}
      {!approved && (
        <div className="sticky bottom-4 flex items-center justify-between rounded-lg border border-slate-200 bg-white/90 p-4 shadow-lg backdrop-blur-md">
          <Link href="/treatment-plan" className="text-sm font-medium text-slate-500 hover:text-slate-800">← Plans</Link>
          <div className="flex items-center gap-3">
            <button onClick={handleSave} className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <Save className="h-4 w-4 text-slate-400" />{saved ? "Saved ✓" : "Save Progress"}
            </button>
            <button onClick={handleApprove} className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">
              <Send className="h-4 w-4" /> Approve Treatment Plan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
