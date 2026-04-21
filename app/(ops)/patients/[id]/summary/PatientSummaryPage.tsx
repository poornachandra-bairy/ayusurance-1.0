"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useAppStore } from "@/lib/store/useAppStore";
import { PageHeader } from "@/app/components/shell/PageHeader";
import workflowStagesV2 from "@/data/workflow-stages-v2.json";
import requiredDocs from "@/data/required-documents.json";
import qcStageDefs from "@/data/qc-stage-definitions.json";
import { WORKFLOW_STAGE_IDS } from "@/lib/types/workflow";
import { formatDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import {
  ArrowLeft, User, CheckCircle2, Clock, AlertCircle,
  DollarSign, FileText, Shield, Star, LogIn, Package, Download,
} from "lucide-react";

function Section({ title, icon: Icon, children, color = "slate" }: {
  title: string; icon: React.ElementType; children: React.ReactNode; color?: "slate" | "emerald" | "amber" | "blue";
}) {
  const col = { slate: { b: "border-slate-200", h: "bg-slate-50/50", i: "text-slate-400" }, emerald: { b: "border-emerald-200", h: "bg-emerald-50/60", i: "text-emerald-600" }, amber: { b: "border-amber-200", h: "bg-amber-50/60", i: "text-amber-500" }, blue: { b: "border-blue-200", h: "bg-blue-50/60", i: "text-blue-500" } }[color];
  return (
    <div className={cn("rounded-lg border bg-white shadow-sm overflow-hidden", col.b)}>
      <div className={cn("flex items-center gap-2 border-b px-5 py-3", col.h, col.b)}>
        <Icon className={cn("h-4 w-4", col.i)} />
        <p className="text-sm font-semibold text-slate-800">{title}</p>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function Badge({ done, label }: { done: boolean; label: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-medium",
      done ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500")}>
      {done ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />} {label}
    </span>
  );
}

export function PatientSummaryPage() {
  const { id } = useParams<{ id: string }>();
  const {
    patients, pracharakas,
    workflowRecordByPatientId, actionLogsByPatientId,
    wishListV2Entries, astroEligibilityV2Entries, screeningV2Records,
    treatmentPlanV2Records, pkConsultationV2Records,
    reservationV2Records, portalOnboardingV2Records,
    travelPrepRecords, paymentRecords, arrivalAdmissionRecords,
    patientDocuments, qualityChecklists, feedbackRecords,
  } = useAppStore();

  const patient    = patients.find((p) => p.id === id);
  const pr         = pracharakas.find((p) => p.id === patient?.pracharakaId);
  const wr         = workflowRecordByPatientId(id);
  const logs       = actionLogsByPatientId(id);

  // Phase records
  const wl    = wishListV2Entries.find((e) => e.patientId === id);
  const astro = astroEligibilityV2Entries.find((e) => e.patientId === id);
  const scr   = screeningV2Records.find((s) => s.patientId === id);
  const txPlan= treatmentPlanV2Records.find((t) => t.patientId === id);
  const pkC   = pkConsultationV2Records.find((c) => c.patientId === id);
  const res   = reservationV2Records.find((r) => r.patientId === id);
  const pob   = portalOnboardingV2Records.find((p) => p.patientId === id);
  const trv   = travelPrepRecords.find((t) => t.patientId === id);
  const pay   = paymentRecords.find((p) => p.patientId === id);
  const adm   = arrivalAdmissionRecords.find((a) => a.patientId === id);
  const docs  = patientDocuments.find((d) => d.patientId === id);
  const qc    = qualityChecklists.find((q) => q.patientId === id);
  const fb    = feedbackRecords.find((f) => f.patientId === id);

  const completedStages = wr ? WORKFLOW_STAGE_IDS.filter((sid) => wr.stages[sid]?.status === "completed").length : 0;

  // Data export
  function exportSummary() {
    const summary = {
      patient, pracharaka: pr, workflowRecord: wr,
      wishList: wl, astroEligibility: astro, screening: scr,
      treatmentPlan: txPlan, pkConsultation: pkC,
      reservation: res, portalOnboarding: pob,
      travelPrep: trv, payment: pay, admission: adm,
      documents: docs, qualityControl: qc, feedback: fb,
      actionLogs: logs,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(summary, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href = url; a.download = `${id}-summary.json`; a.click();
    URL.revokeObjectURL(url);
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <User className="mb-3 h-10 w-10 text-slate-300" />
        <p className="text-sm text-slate-600">Patient not found: {id}</p>
        <Link href="/patients" className="mt-4 text-xs text-slate-500 hover:underline flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" /> Back
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-5 pb-16">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Link href={`/patients/${id}`} className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-3.5 w-3.5" /> Patient Detail
        </Link>
        <button onClick={exportSummary}
          className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-sm">
          <Download className="h-3.5 w-3.5" /> Export JSON
        </button>
      </div>

      <PageHeader title={`${patient.name} — Full Workflow Summary`} subtitle={`Patient ID: ${patient.id} · ${completedStages}/12 stages complete`} />

      {/* Identity */}
      <Section title="Patient Identity" icon={User}>
        <div className="grid gap-3 sm:grid-cols-3 text-sm">
          {[["Name", patient.name], ["ID", patient.id], ["Age / Gender", `${patient.age}y · ${patient.gender}`], ["Pracharaka", pr?.name ?? "—"], ["City", `${patient.city}, ${patient.state}`], ["Nationality", patient.nationality]].map(([l, v]) => (
            <div key={l}><p className="text-[10px] font-semibold uppercase text-slate-400">{l}</p><p className="text-slate-700">{v}</p></div>
          ))}
        </div>
      </Section>

      {/* Workflow pipeline */}
      <Section title="Workflow Progression" icon={CheckCircle2} color="emerald">
        <div className="space-y-1">
          {WORKFLOW_STAGE_IDS.map((sid, idx) => {
            const stageDef = workflowStagesV2.stages.find((s) => s.id === sid);
            const record   = wr?.stages[sid];
            const status   = record?.status ?? "not_started";
            const isCurrent = wr?.currentWorkflowStageId === sid;
            return (
              <div key={sid} className={cn("flex items-center gap-3 rounded-md border px-3 py-2",
                status === "completed" ? "border-emerald-100 bg-emerald-50" :
                isCurrent ? "border-blue-100 bg-blue-50" : "border-slate-100 bg-white")}>
                <div className={cn("h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center text-[10px] font-bold",
                  status === "completed" ? "border-emerald-500 bg-emerald-500 text-white" :
                  isCurrent ? "border-blue-500 text-blue-500" : "border-slate-300 text-slate-400")}>
                  {status === "completed" ? "✓" : idx + 1}
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <p className={cn("text-sm", status === "completed" ? "font-medium text-emerald-800" : isCurrent ? "font-medium text-blue-800" : "text-slate-600")}>{stageDef?.label ?? sid}</p>
                  <div className="flex items-center gap-2">
                    {isCurrent && <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-700 font-semibold">Current</span>}
                    {record?.completedAt && <span className="text-[10px] text-slate-400">{formatDate(record.completedAt)}</span>}
                    <span className={cn("text-[10px] font-medium rounded px-1.5 py-0.5",
                      status === "completed" ? "bg-emerald-100 text-emerald-700" :
                      status === "in_progress" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500")}>{status.replace(/_/g, " ")}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Payment State */}
      <Section title="Payment State" icon={DollarSign} color="blue">
        <div className="flex flex-wrap gap-3">
          <Badge done={res?.feePaid ?? false} label={`Reservation $300 ${res?.feePaid ? "✓" : "Pending"}`} />
          <Badge done={pay?.advancePaid ?? false} label={`Advance ${pay?.advancePaid ? `✓ ${pay.advanceAmountUSD ? `$${pay.advanceAmountUSD}` : "TBF"}` : "Pending"}`} />
          <Badge done={pay?.finalPaid ?? false} label={`Final ${pay?.finalPaid ? `✓ $${pay.finalAmountUSD ?? "—"}` : "Pending"}`} />
          {pay?.declaredPaymentMode && <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600">Declared: {pay.declaredPaymentMode.replace(/_/g, " ")}</span>}
        </div>
      </Section>

      {/* Documents */}
      <Section title="Required Documents" icon={FileText}>
        {!docs ? (
          <p className="text-xs italic text-slate-400">Documents not yet initiated.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {requiredDocs.documents.filter((d) => docs.isInternational ? d.requiredForInternational : d.requiredForDomestic).map((doc) => {
              const docStatus = docs.documents.find((ds) => ds.docId === doc.id);
              return (
                <div key={doc.id} className="flex items-center gap-2 text-xs text-slate-700">
                  <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="flex-1">{doc.label}</span>
                  <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium",
                    docStatus?.status === "verified"  ? "bg-emerald-100 text-emerald-700" :
                    docStatus?.status === "submitted" ? "bg-blue-100 text-blue-700" :
                    docStatus?.status === "rejected"  ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-500")}>
                    {docStatus?.status?.replace(/_/g, " ") ?? "not submitted"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* Treatment Planning */}
      <Section title="Treatment Planning Readiness" icon={Package}>
        <div className="flex flex-wrap gap-3">
          <Badge done={!!txPlan} label="Treatment Plan Created" />
          <Badge done={txPlan?.status === "approved"} label="Plan Approved" />
          <Badge done={txPlan?.status === "medicines_dispatched" || txPlan?.status === "approved"} label="Medicine List Forwarded" />
          <Badge done={txPlan?.status === "schedule_distributed" || txPlan?.status === "medicines_dispatched" || txPlan?.status === "approved"} label="Therapy Schedule Distributed" />
          <Badge done={!!pkC} label="PK Consultation" />
          <Badge done={pkC?.status === "completed"} label="PK Consultation Complete" />
        </div>
      </Section>

      {/* Admission */}
      <Section title="Admission Status" icon={LogIn} color="emerald">
        <div className="flex flex-wrap gap-3">
          <Badge done={pob?.status === "completed"} label="Portal Onboarding" />
          <Badge done={trv?.isComplete ?? false} label="Travel Prep" />
          <Badge done={adm?.isAdmitted ?? false} label="Admitted to PK Program" />
          {adm?.admittedAt && <span className="text-xs text-slate-500">on {formatDate(adm.admittedAt)}</span>}
        </div>
      </Section>

      {/* QC Status */}
      <Section title="Quality Control Status" icon={Shield} color="amber">
        {!qc ? (
          <p className="text-xs italic text-slate-400">QC record not initiated — patient must be admitted first.</p>
        ) : (
          <div className="space-y-2">
            {qcStageDefs.qcStages.map((stage) => {
              const done  = stage.items.filter((i) => qc.checklistItems[`${stage.id}::${i.id}`]).length;
              const pct   = Math.round((done / stage.items.length) * 100);
              return (
                <div key={stage.id} className="flex items-center gap-3">
                  <div className={cn("h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center",
                    pct === 100 ? "border-emerald-500 bg-emerald-500" : "border-slate-300")}>
                    {pct === 100 && <CheckCircle2 className="h-3 w-3 text-white" />}
                  </div>
                  <span className="text-xs text-slate-700 flex-1">{stage.label}</span>
                  <div className="h-1.5 w-20 rounded-full bg-slate-100 overflow-hidden">
                    <div className={cn("h-full rounded-full", pct === 100 ? "bg-emerald-500" : "bg-slate-400")} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[11px] text-slate-500 w-8 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* Feedback */}
      {fb && (
        <Section title="Patient Feedback" icon={Star} color="amber">
          <div className="grid gap-3 sm:grid-cols-3 text-sm">
            {[["Overall", `${fb.overallRating}/5`], ["NPS", `${fb.npsScore}/10`], ["Recommend", fb.wouldRecommend ? "Yes" : "No"]].map(([l, v]) => (
              <div key={l}><p className="text-[10px] font-semibold uppercase text-slate-400">{l}</p><p className="text-slate-700 font-medium">{v}</p></div>
            ))}
          </div>
          {fb.testimonial && <p className="mt-3 text-sm italic text-slate-600 border-l-2 border-amber-300 pl-3">{fb.testimonial}</p>}
        </Section>
      )}

      {/* Recent activity */}
      <Section title={`Action Log (${logs.length} entries)`} icon={Clock}>
        {logs.length === 0 ? (
          <p className="text-xs italic text-slate-400">No log entries.</p>
        ) : (
          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {logs.slice(0, 20).map((log) => (
              <div key={log.id} className="flex gap-3 rounded border border-slate-100 bg-slate-50 px-3 py-2">
                <span className="shrink-0 w-22 text-[10px] text-slate-400 leading-tight pt-0.5">{formatDate(log.timestamp)}</span>
                <div>
                  <span className="text-[10px] font-semibold text-slate-500">{log.actor}</span>
                  <p className="text-xs text-slate-700 mt-0.5">{log.summary}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
