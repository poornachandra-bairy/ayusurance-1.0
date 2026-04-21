"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAppStore } from "@/lib/store/useAppStore";
import { PageHeader } from "@/app/components/shell/PageHeader";
import type { PKConsultationStatus } from "@/lib/types/treatmentV2";
import checklistData   from "@/data/pk-consultation-checklist.json";
import amapachanaData  from "@/data/amapachana-structure.json";
import { formatDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import {
  ArrowLeft, MessageSquare, User, DollarSign, CheckCircle2,
  Video, FlaskConical, Save, Send, Users,
} from "lucide-react";

const inputCls = "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400";

function Section({ title, icon: Icon, children, accent = false }: {
  title: string; icon: React.ElementType; children: React.ReactNode; accent?: boolean;
}) {
  return (
    <section className={cn("rounded-lg border bg-white shadow-sm overflow-hidden", accent ? "border-violet-200" : "border-slate-200")}>
      <div className={cn("flex items-center gap-2 border-b px-5 py-3", accent ? "border-violet-100 bg-violet-50/60" : "border-slate-100 bg-slate-50/50")}>
        <Icon className={cn("h-4 w-4", accent ? "text-violet-500" : "text-slate-400")} />
        <h2 className={cn("text-sm font-semibold", accent ? "text-violet-800" : "text-slate-800")}>{title}</h2>
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

function CheckRow({ label, description, checked, onToggle, disabled }: { label: string; description?: string; checked: boolean; onToggle?: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onToggle} disabled={disabled || !onToggle}
      className={cn("flex w-full items-start gap-3 rounded-md border px-4 py-2.5 text-left text-sm transition-all",
        checked ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50",
        disabled && "cursor-default"
      )}>
      <div className={cn("mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center",
        checked ? "border-emerald-500 bg-emerald-500" : "border-slate-300")}>
        {checked && <CheckCircle2 className="h-3 w-3 text-white" />}
      </div>
      <div>
        <p className={cn("font-medium", checked ? "text-emerald-800" : "text-slate-700")}>{label}</p>
        {description && <p className="text-[11px] text-slate-400 mt-0.5">{description}</p>}
      </div>
    </button>
  );
}

export function PKConsultationDetailPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const {
    pkConsultationV2ByPatientId, treatmentPlanV2ByPatientId,
    patients, pracharakas,
    initiatePKConsultation, updatePKConsultationV2, completePKConsultation,
  } = useAppStore();

  const patient  = patients.find((p) => p.id === patientId);
  const pr       = pracharakas.find((p) => p.id === patient?.pracharakaId);
  const plan     = treatmentPlanV2ByPatientId(patientId);

  useEffect(() => {
    if (patient && plan && !pkConsultationV2ByPatientId(patientId)) {
      initiatePKConsultation(patientId, plan.id);
    }
  }, [patient, plan, patientId]);

  const consult = pkConsultationV2ByPatientId(patientId);

  const [status,         setStatus]         = useState<PKConsultationStatus>(consult?.status ?? "pending");
  const [vaidyaName,     setVaidyaName]     = useState(consult?.treatingVaidyaName ?? plan?.treatingVaidyaName ?? "");
  const [feePaid,        setFeePaid]        = useState(consult?.feePaid ?? false);
  const [scheduledDate,  setScheduledDate]  = useState(consult?.scheduledDate ?? "");
  const [checklistItems, setChecklistItems] = useState<Record<string, boolean>>(consult?.checklistItems ?? {});
  const [orientSent,     setOrientSent]     = useState(consult?.orientationVideosSent ?? false);
  const [orientDone,     setOrientDone]     = useState(consult?.orientationVideosDone ?? false);
  const [amapachana,     setAmapachana]     = useState<Record<string, string>>(consult?.amapachana as any ?? {});
  const [notes,          setNotes]          = useState(consult?.consultationNotes ?? "");
  const [saved,          setSaved]          = useState(false);

  const completed = consult?.status === "completed";

  useEffect(() => {
    if (consult) {
      setStatus(consult.status); setFeePaid(consult.feePaid);
      setScheduledDate(consult.scheduledDate ?? "");
      setChecklistItems(consult.checklistItems ?? {});
      setOrientSent(consult.orientationVideosSent); setOrientDone(consult.orientationVideosDone);
      setAmapachana(consult.amapachana as any ?? {});
      setNotes(consult.consultationNotes ?? "");
    }
  }, [consult?.id]);

  if (!patient || !consult) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <MessageSquare className="mb-3 h-10 w-10 text-slate-300" />
        <p className="text-sm text-slate-600">PK Consultation loading…</p>
        <Link href="/pk-consultation" className="mt-4 text-xs text-violet-600 hover:underline flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" /> Back to Queue
        </Link>
      </div>
    );
  }

  const checklistDone  = Object.values(checklistItems || {}).filter(Boolean).length;
  const checklistTotal = checklistData.items.length;
  const checklistPct   = Math.round((checklistDone / checklistTotal) * 100);

  function handleSave() {
    if (!consult) return;
    updatePKConsultationV2(consult.id, {
      status, feePaid, scheduledDate: scheduledDate || undefined,
      treatingVaidyaName: vaidyaName,
      checklistItems,
      orientationVideosSent: orientSent, orientationVideosDone: orientDone,
      amapachana: amapachana as any,
      consultationNotes: notes,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleComplete() {
    handleSave();
    completePKConsultation(consult!.id, notes);
  }

  function toggleChecklist(id: string) {
    setChecklistItems((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="max-w-4xl space-y-5 pb-16">
      <Link href="/pk-consultation" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-3.5 w-3.5" /> PK Consultations
      </Link>

      <PageHeader
        title={`PK Consultation — ${patient.name}`}
        subtitle={`Record ${consult.id} · Treating Vaidya: ${vaidyaName || "Not Assigned"}`}
      />

      {/* Banner */}
      <div className={cn("flex flex-wrap items-center gap-3 rounded-lg border px-5 py-3",
        completed ? "border-emerald-200 bg-emerald-50" : "border-violet-200 bg-violet-50")}>
        <span className="inline-flex items-center gap-1.5 rounded border border-violet-200 bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-800">
          <DollarSign className="h-3 w-3" /> Fee: $100
        </span>
        <span className="inline-flex items-center gap-1.5 rounded border border-violet-200 bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-800">
          Checklist: {checklistPct}% complete
        </span>
        {completed && (
          <Link
            href={`/reservation/${patientId}`}
            className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline"
          >
            ✓ Completed — Open Reservation →
          </Link>
        )}
      </div>

      {/* Patient Context */}
      <Section title="Patient & Treatment Context" icon={User}>
        <div className="grid gap-3 sm:grid-cols-3">
          <Info label="Patient"      value={patient.name} />
          <Info label="Pracharaka"   value={pr?.name} />
          <Info label="Treatment Plan" value={plan?.id} />
          <Info label="PK Type"      value={plan?.protocol?.panchakarmaType} />
          <Info label="Duration"     value={plan?.protocol?.therapyDuration} />
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Treating Vaidya</label>
            <input value={vaidyaName} onChange={(e) => setVaidyaName(e.target.value)} disabled={completed} placeholder="Treating Vaidya name…" className={inputCls} />
          </div>
        </div>
      </Section>

      {/* Consultation Details */}
      <Section title="Consultation Scheduling & Participants" icon={MessageSquare}>
        <div className="grid gap-4 sm:grid-cols-2 mb-4">
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as PKConsultationStatus)} disabled={completed} className={inputCls}>
              <option value="pending">Pending</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="follow_up_pending">Follow-up Pending</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Scheduled Date</label>
            <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} disabled={completed} className={inputCls} />
          </div>
        </div>

        {/* Fee */}
        <div className="mb-4">
          <button type="button" onClick={() => !completed && setFeePaid((v) => !v)}
            className={cn("flex items-center gap-3 rounded-md border px-4 py-2.5 text-sm font-medium transition-all",
              feePaid ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
              completed && "cursor-default"
            )}>
            <div className={cn("h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center",
              feePaid ? "border-emerald-500 bg-emerald-500" : "border-slate-300")}>
              {feePaid && <CheckCircle2 className="h-3 w-3 text-white" />}
            </div>
            Consultation Fee Paid — $100
          </button>
        </div>

        {/* Mandatory participants */}
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">Mandatory Participants</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Patient",          name: patient.name },
              { label: "Treating Vaidya",  name: vaidyaName || "Not Assigned" },
            ].map((p) => (
              <span key={p.label} className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-medium">{p.label}</span>
                <span className="text-slate-400">— {p.name}</span>
              </span>
            ))}
          </div>
        </div>
      </Section>

      {/* Consultation Checklist */}
      <Section title="Consultation Checklist" icon={CheckCircle2} accent>
        <p className="mb-3 text-xs text-slate-500">
          All items must be covered during the 30-minute PK Consultation with the patient.
        </p>
        <div className="space-y-2">
          {checklistData.items.map((item) => (
            <CheckRow
              key={item.id}
              label={item.label}
              description={item.description}
              checked={(checklistItems || {})[item.id] ?? false}
              onToggle={() => !completed && toggleChecklist(item.id)}
              disabled={completed}
            />
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-400">{checklistDone} of {checklistTotal} items completed</p>
      </Section>

      {/* SHIVA Academy — Orientation Videos */}
      <Section title="SHIVA Academy — Orientation Videos" icon={Video}>
        <p className="mb-3 text-xs text-slate-500">
          Patient must be directed to SHIVA Academy orientation video modules as part of this consultation.
        </p>
        <div className="space-y-2">
          <CheckRow label="Orientation Videos Sent to Patient" checked={orientSent}
            onToggle={() => !completed && setOrientSent((v) => !v)} disabled={completed} />
          <CheckRow label="Patient Confirmed Orientation Videos Completed" checked={orientDone}
            onToggle={() => !completed && setOrientDone((v) => !v)} disabled={completed} />
        </div>
      </Section>

      {/* Amapachana Prescription */}
      <Section title="Amapachana Prescription" icon={FlaskConical}>
        <p className="mb-3 text-xs text-slate-500">
          Prescribe digestive herbs, detox preparation medicines, diet guidelines, and geography-appropriate purchase links.
        </p>
        <div className="space-y-4">
          {amapachanaData.fields.map((field) => (
            <div key={field.id}>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {field.label}
                <span className="ml-1 normal-case font-normal text-slate-400">— {field.description}</span>
              </label>
              <textarea
                value={amapachana[field.id] ?? ""}
                onChange={(e) => setAmapachana((prev) => ({ ...prev, [field.id]: e.target.value }))}
                disabled={completed} rows={3} placeholder={field.placeholder}
                className={cn(inputCls, "resize-none")}
              />
            </div>
          ))}
        </div>
      </Section>

      {/* Consultation Notes */}
      <Section title="Consultation Notes" icon={MessageSquare}>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} disabled={completed}
          rows={4} placeholder="Overall consultation notes, patient questions, agreed follow-ups…"
          className={cn(inputCls, "resize-none")} />
      </Section>

      {/* Sticky action bar */}
      {!completed && (
        <div className="sticky bottom-4 flex items-center justify-between rounded-lg border border-slate-200 bg-white/90 p-4 shadow-lg backdrop-blur-md">
          <Link href="/pk-consultation" className="text-sm font-medium text-slate-500 hover:text-slate-800">← Consultations</Link>
          <div className="flex items-center gap-3">
            <button onClick={handleSave} className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <Save className="h-4 w-4 text-slate-400" />{saved ? "Saved ✓" : "Save Progress"}
            </button>
            <button onClick={handleComplete} className="inline-flex items-center gap-2 rounded-md bg-violet-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-violet-700">
              <Send className="h-4 w-4" /> Mark Consultation Complete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
