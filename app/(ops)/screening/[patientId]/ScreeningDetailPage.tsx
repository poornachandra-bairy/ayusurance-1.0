"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAppStore } from "@/lib/store/useAppStore";
import { PageHeader } from "@/app/components/shell/PageHeader";
import type { ScreeningV2Status, ScheduleBucket, ScreeningDecision } from "@/lib/types/screeningV2";
import consultCfg    from "@/data/screening-consultation-config.json";
import preReqData    from "@/data/screening-pre-requirements.json";
import scheduleBkts  from "@/data/screening-schedule-buckets.json";
import participantRoles from "@/data/screening-participant-roles.json";
import trainingMods  from "@/data/screening-training-modules.json";
import docTypes      from "@/data/screening-document-types.json";
import hqSchema      from "@/data/screening-health-questionnaire.json";
import { formatDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import {
  ArrowLeft, Stethoscope, User, FileText, Video,
  CheckCircle2, Clock, ClipboardList, DollarSign, Users,
  Upload, AlertTriangle, Save, Send, ChevronDown, ChevronUp, Star,
} from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const inputCls = "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400";

function Section({ title, icon: Icon, children, accent = false }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <section className={cn(
      "rounded-lg border bg-white shadow-sm overflow-hidden",
      accent ? "border-teal-200" : "border-slate-200"
    )}>
      <div className={cn(
        "flex items-center gap-2 border-b px-5 py-3",
        accent ? "border-teal-100 bg-teal-50/60" : "border-slate-100 bg-slate-50/50"
      )}>
        <Icon className={cn("h-4 w-4", accent ? "text-teal-600" : "text-slate-400")} />
        <h2 className={cn("text-sm font-semibold", accent ? "text-teal-800" : "text-slate-800")}>{title}</h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

function Info({ label, value, mono = false }: { label: string; value?: string | number; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-0.5">{label}</p>
      <p className={cn("text-sm text-slate-800", !value && "italic text-slate-400", mono && "font-mono")}>
        {value || "—"}
      </p>
    </div>
  );
}

function CheckRow({ label, checked, onToggle, disabled }: { label: string; checked: boolean; onToggle?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled || !onToggle}
      className={cn(
        "flex w-full items-center gap-3 rounded-md border px-4 py-2.5 text-left text-sm transition-all",
        checked
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
        disabled && "cursor-default"
      )}
    >
      <div className={cn("h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center",
        checked ? "border-emerald-500 bg-emerald-500" : "border-slate-300"
      )}>
        {checked && <CheckCircle2 className="h-3 w-3 text-white" />}
      </div>
      {label}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function ScreeningDetailPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const {
    screeningV2ByPatientId, patients, pracharakas, wishListV2Entries,
    astroEligibilityV2Entries, workflowRecordByPatientId,
    initiateScreening, updateScreeningV2, addScreeningDocument, submitScreeningDecision,
  } = useAppStore();

  const patient   = patients.find((p) => p.id === patientId);
  const pr        = pracharakas.find((p) => p.id === patient?.pracharakaId);
  const wl        = wishListV2Entries.find((w) => w.patientId === patientId);
  const astro     = astroEligibilityV2Entries?.find((a: any) => a.patientId === patientId);
  const wfRecord  = workflowRecordByPatientId(patientId);

  // Auto-initiate if not yet created (eligible patient entering for first time)
  useEffect(() => {
    if (patient && astro && !screeningV2ByPatientId(patientId)) {
      initiateScreening(patientId, astro.id);
    }
  }, [patient, astro, patientId]);

  const scr = screeningV2ByPatientId(patientId);

  // ── Local form state ──
  const [status,       setStatus]      = useState<ScreeningV2Status>(scr?.status ?? "awaiting_pre_screening");
  const [feePaid,      setFeePaid]     = useState(scr?.consultationFeePaid ?? false);
  const [hqCompleted,  setHqCompleted] = useState(scr?.healthQuestionnaireCompleted ?? false);
  const [hqAnswers,    setHqAnswers]   = useState<Record<string, string>>(scr?.healthQuestionnaire ?? {});
  const [hqExpanded,   setHqExpanded]  = useState(false);
  const [scheduleBkt,  setScheduleBkt] = useState<ScheduleBucket | "">(scr?.initialConsultation?.scheduleBucket ?? "");
  const [initDate,     setInitDate]    = useState(scr?.initialConsultation?.scheduledDate ?? "");
  const [initDone,     setInitDone]    = useState(!!scr?.initialConsultation?.conductedAt);
  const [initRecorded, setInitRecorded] = useState(scr?.initialConsultation?.recordingDone ?? false);
  const [initShared,   setInitShared]  = useState(scr?.initialConsultation?.recordingSharedWithPatient ?? false);
  const [initStored,   setInitStored]  = useState(scr?.initialConsultation?.recordingStoredInPortal ?? false);
  const [fuDate,       setFuDate]      = useState(scr?.followUpConsultation?.scheduledDate ?? "");
  const [fuDone,       setFuDone]      = useState(!!scr?.followUpConsultation?.conductedAt);
  const [fuRecorded,   setFuRecorded]  = useState(scr?.followUpConsultation?.recordingDone ?? false);
  const [fuShared,     setFuShared]    = useState(scr?.followUpConsultation?.recordingSharedWithPatient ?? false);
  const [fuStored,     setFuStored]    = useState(scr?.followUpConsultation?.recordingStoredInPortal ?? false);
  const [training,     setTraining]    = useState<Record<string, boolean>>(
    trainingMods.modules.reduce((acc, m) => ({ ...acc, [m.id]: scr?.vaidyaTraining?.[m.id as keyof typeof scr.vaidyaTraining] ?? false }), {})
  );
  const [decision,     setDecision]    = useState<ScreeningDecision>(scr?.decision ?? "pending");
  const [decisionNotes, setDecisionNotes] = useState(scr?.decisionNotes ?? "");
  const [saved,        setSaved]       = useState(false);

  const submitted = scr?.decision === "approved" || scr?.decision === "on_hold";

  useEffect(() => {
    if (scr) {
      setStatus(scr.status); setFeePaid(scr.consultationFeePaid);
      setHqCompleted(scr.healthQuestionnaireCompleted);
      setHqAnswers(scr.healthQuestionnaire);
      setDecision(scr.decision);
      setDecisionNotes(scr.decisionNotes ?? "");
    }
  }, [scr?.id]);

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Stethoscope className="mb-3 h-10 w-10 text-slate-300" />
        <p className="text-sm text-slate-600">Patient not found: {patientId}</p>
        <Link href="/screening" className="mt-4 text-xs text-teal-600 hover:underline flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" /> Back to Screening Queue
        </Link>
      </div>
    );
  }

  function buildSessionPayload(type: "initial" | "followup") {
    const isInit = type === "initial";
    return {
      sessionType: type,
      scheduleBucket: (scheduleBkt || undefined) as ScheduleBucket | undefined,
      scheduledDate:  isInit ? initDate || undefined : fuDate || undefined,
      conductedAt:    (isInit ? initDone : fuDone) ? new Date().toISOString() : undefined,
      durationMinutes: 30 as const,
      participants: participantRoles.roles.map((r) => ({
        role: r.id as any,
        name: r.id === "patient" ? patient?.name : r.id === "pracharaka" ? pr?.name : undefined,
        confirmed: true,
      })),
      recordingDone:               isInit ? initRecorded : fuRecorded,
      recordingSharedWithPatient:  isInit ? initShared   : fuShared,
      recordingStoredInPortal:     isInit ? initStored   : fuStored,
    };
  }

  function handleSave() {
    if (!scr) return;
    updateScreeningV2(scr.id, {
      status,
      consultationFeePaid: feePaid,
      healthQuestionnaireCompleted: hqCompleted,
      healthQuestionnaire: hqAnswers,
      initialConsultation:  buildSessionPayload("initial"),
      followUpConsultation: buildSessionPayload("followup"),
      vaidyaTraining: {
        live_training_sessions: training["live_training_sessions"] ?? false,
        recorded_modules:       training["recorded_modules"] ?? false,
        case_studies:           training["case_studies"] ?? false,
        protocol_training:      training["protocol_training"] ?? false,
        consultation_framework: training["consultation_framework"] ?? false,
        completedDates: scr.vaidyaTraining?.completedDates ?? {},
      },
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleSubmit() {
    if (decision === "pending") { alert("Please select a final decision before submitting."); return; }
    handleSave();
    submitScreeningDecision(scr!.id, decision, decisionNotes);
  }

  function handleAddDocument(type: "medical_records" | "consent_form" | "disclaimer") {
    const fileName = prompt(`Enter file name for ${type.replace(/_/g, " ")}:`);
    if (!fileName || !scr) return;
    addScreeningDocument(scr.id, {
      id: `${scr.id}-DOC-${Date.now()}`,
      type,
      fileName,
      uploadedAt: new Date().toISOString(),
    });
  }

  const docsByType = (type: string) => scr?.documents.filter((d) => d.type === type) ?? [];

  const trainingPct = Math.round(
    (Object.values(training).filter(Boolean).length / trainingMods.modules.length) * 100
  );

  return (
    <div className="max-w-4xl space-y-5 pb-16">
      <Link href="/screening" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-3.5 w-3.5" /> Screening Queue
      </Link>

      <PageHeader
        title={`Screening — ${patient.name}`}
        subtitle={`Record ${scr?.id ?? "Pending Init"} · $${consultCfg.fee.amountUSD} teleconsultation`}
      />

      {/* Status Banner */}
      <div className={cn(
        "flex flex-wrap items-center gap-3 rounded-lg border px-5 py-3",
        submitted ? "border-emerald-200 bg-emerald-50" : "border-teal-200 bg-teal-50"
      )}>
        <span className="inline-flex items-center gap-1.5 rounded border border-teal-200 bg-teal-100 px-2.5 py-0.5 text-xs font-medium text-teal-800">
          <Video className="h-3 w-3" /> {consultCfg.mode} · {consultCfg.duration.label}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded border border-teal-200 bg-teal-100 px-2.5 py-0.5 text-xs font-medium text-teal-800">
          <DollarSign className="h-3 w-3" /> Fee: ${consultCfg.fee.amountUSD} {consultCfg.fee.currency}
        </span>
        {submitted && scr?.decision === "approved" && (
          <Link
            href={`/treatment-plan/${patientId}`}
            className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline"
          >
            Open Treatment Plan →
          </Link>
        )}
      </div>

      {/* Patient Context */}
      <Section title="Patient & Referral Context" icon={User}>
        <div className="grid gap-3 sm:grid-cols-3">
          <Info label="Patient Name"       value={patient.name} />
          <Info label="Patient ID"         value={patient.id} mono />
          <Info label="Referring Pracharaka" value={pr?.name ?? "—"} />
          <Info label="Astro Decision"     value={astro?.decision?.replace(/_/g, " ") ?? "—"} />
          <Info label="Astro Record"       value={astro?.id} mono />
          <Info label="Workflow Stage"     value={wfRecord?.currentWorkflowStageId?.replace(/_/g, " ") ?? "—"} />
        </div>
        {wl && (
          <div className="mt-3 grid gap-2 sm:grid-cols-3 text-sm border-t border-slate-100 pt-3">
            <Info label="DOB"           value={wl.data.dateOfBirth} />
            <Info label="Place of Birth" value={wl.data.placeOfBirth} />
            <Info label="Health Concern" value={wl.data.healthConcerns} />
          </div>
        )}
      </Section>

      {/* Pre-Screening Checklist */}
      <Section title="Pre-Screening Completeness" icon={ClipboardList}>
        <div className="space-y-2">
          {/* Fee */}
          <CheckRow
            label={`Consultation Fee Paid — $${consultCfg.fee.amountUSD}`}
            checked={feePaid}
            onToggle={() => !submitted && setFeePaid((v) => !v)}
            disabled={submitted}
          />
          {/* Health Questionnaire */}
          <div>
            <CheckRow
              label="Health Questionnaire Completed"
              checked={hqCompleted}
              onToggle={() => !submitted && setHqCompleted((v) => !v)}
              disabled={submitted}
            />
          </div>
          {/* Documents */}
          {docTypes.documentTypes.map((dt) => {
            const typeDocs = docsByType(dt.id);
            const hasDocs = typeDocs.length > 0;
            return (
              <div key={dt.id} className={cn(
                "flex items-center justify-between rounded-md border px-4 py-2.5 text-sm",
                hasDocs ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn("h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center",
                    hasDocs ? "border-emerald-500 bg-emerald-500" : "border-slate-300"
                  )}>
                    {hasDocs && <CheckCircle2 className="h-3 w-3 text-white" />}
                  </div>
                  <div>
                    <p className={cn("font-medium", hasDocs ? "text-emerald-800" : "text-slate-700")}>{dt.label}</p>
                    {hasDocs && typeDocs.map((d) => (
                      <p key={d.id} className="text-[10px] text-emerald-600">
                        {d.fileName} · {formatDate(d.uploadedAt)}
                      </p>
                    ))}
                  </div>
                </div>
                {!submitted && (
                  <button
                    onClick={() => handleAddDocument(dt.id as any)}
                    className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-50"
                  >
                    <Upload className="h-3 w-3" /> {hasDocs ? "Replace" : "Add File"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {/* Health Questionnaire */}
      <Section title="Health Questionnaire" icon={FileText}>
        <button
          onClick={() => setHqExpanded((v) => !v)}
          className="mb-3 inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-800"
        >
          {hqExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {hqExpanded ? "Collapse" : "Open"} questionnaire form ({hqSchema.sections.length} sections)
        </button>

        {hqExpanded && (
          <div className="space-y-5">
            {hqSchema.sections.map((sec) => (
              <div key={sec.id} className="rounded-md border border-slate-100 p-4 bg-slate-50">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">{sec.title}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {sec.fields.map((f) => (
                    <div key={f.id} className={f.type === "textarea" ? "col-span-full" : ""}>
                      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        {f.label}
                      </label>
                      {f.type === "textarea" ? (
                        <textarea
                          value={hqAnswers[f.id] ?? ""}
                          onChange={(e) => setHqAnswers((prev) => ({ ...prev, [f.id]: e.target.value }))}
                          disabled={submitted}
                          rows={3}
                          placeholder={f.placeholder}
                          className={cn(inputCls, "resize-none")}
                        />
                      ) : f.type === "select" ? (
                        <select
                          value={hqAnswers[f.id] ?? ""}
                          onChange={(e) => setHqAnswers((prev) => ({ ...prev, [f.id]: e.target.value }))}
                          disabled={submitted}
                          className={inputCls}
                        >
                          <option value="">— Select —</option>
                          {(f as any).options?.map((o: string) => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={hqAnswers[f.id] ?? ""}
                          onChange={(e) => setHqAnswers((prev) => ({ ...prev, [f.id]: e.target.value }))}
                          disabled={submitted}
                          placeholder={f.placeholder}
                          className={inputCls}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Scheduling & Consultations */}
      <Section title="Scheduling & Teleconsultation" icon={Video} accent>
        {/* Timezone bucket */}
        <div className="mb-5">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-teal-700">Patient Time Zone Bucket</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {scheduleBkts.buckets.map((b) => (
              <button
                key={b.id}
                type="button"
                disabled={submitted}
                onClick={() => setScheduleBkt(b.id as ScheduleBucket)}
                className={cn(
                  "flex flex-col gap-0.5 rounded-md border px-4 py-3 text-left text-sm transition-all",
                  scheduleBkt === b.id
                    ? "border-teal-400 bg-teal-50 ring-1 ring-teal-400 text-teal-800"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                )}
              >
                <span className="font-semibold">{b.label}</span>
                <span className="text-[11px] text-slate-500">{b.timeZones.join(" · ")}</span>
                <span className="text-[10px] text-slate-400 mt-1">{b.notes}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sessions */}
        {consultCfg.sessions.map((sess) => {
          const isInit = sess.id === "initial";
          const done    = isInit ? initDone    : fuDone;
          const date    = isInit ? initDate    : fuDate;
          const setDate = isInit ? setInitDate : setFuDate;
          const setDone = isInit ? setInitDone : setFuDone;
          const recorded = isInit ? initRecorded : fuRecorded;
          const setRec   = isInit ? setInitRecorded : setFuRecorded;
          const shared   = isInit ? initShared   : fuShared;
          const setShared= isInit ? setInitShared  : setFuShared;
          const stored   = isInit ? initStored   : fuStored;
          const setStored= isInit ? setInitStored  : setFuStored;

          return (
            <div key={sess.id} className="mb-5 rounded-md border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800">{sess.label}</p>
                {sess.afterDays && (
                  <span className="text-[11px] text-slate-400 border border-slate-200 rounded px-2 py-0.5">
                    +{sess.afterDays} days after initial
                  </span>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 mb-3">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Scheduled Date</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={submitted} className={inputCls} />
                </div>
                <div className="flex flex-col justify-end">
                  <CheckRow label="Session Conducted" checked={done} onToggle={() => !submitted && setDone((v) => !v)} disabled={submitted} />
                </div>
              </div>
              {/* Participants */}
              <div className="mb-3">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">Mandatory Participants</p>
                <div className="flex flex-wrap gap-2">
                  {participantRoles.roles.map((r) => (
                    <span key={r.id} className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] text-slate-600">
                      <Users className="h-3 w-3 text-slate-400" />
                      {r.label}
                      {r.mandatory && <span className="ml-1 text-red-400">*</span>}
                    </span>
                  ))}
                </div>
              </div>
              {/* Recording */}
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">Recording Status</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  <CheckRow label="Session Recorded"    checked={recorded} onToggle={() => !submitted && setRec((v)    => !v)} disabled={submitted} />
                  <CheckRow label="Shared with Patient" checked={shared}   onToggle={() => !submitted && setShared((v) => !v)} disabled={submitted} />
                  <CheckRow label="Stored in Portal"    checked={stored}   onToggle={() => !submitted && setStored((v) => !v)} disabled={submitted} />
                </div>
              </div>
            </div>
          );
        })}
      </Section>

      {/* Vaidya Training Tracker */}
      <Section title="Screening Vaidya Training Tracker" icon={Star}>
        <div className="mb-3 flex items-center gap-3">
          <div className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${trainingPct}%` }} />
          </div>
          <span className="text-xs font-semibold text-teal-700">{trainingPct}% complete</span>
        </div>
        <div className="space-y-2">
          {trainingMods.modules.map((m) => (
            <CheckRow
              key={m.id}
              label={m.label}
              checked={training[m.id] ?? false}
              onToggle={() => !submitted && setTraining((prev) => ({ ...prev, [m.id]: !prev[m.id] }))}
              disabled={submitted}
            />
          ))}
        </div>
      </Section>

      {/* Screening Stage Status */}
      <Section title="Record Status" icon={ClipboardList}>
        <div className="max-w-sm">
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Update Stage</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as ScreeningV2Status)} disabled={submitted} className={inputCls}>
            <option value="awaiting_pre_screening">Awaiting Pre-Screening</option>
            <option value="pre_screening_complete">Pre-Screening Complete</option>
            <option value="consultation_scheduled">Consultation Scheduled</option>
            <option value="initial_consultation_done">Initial Consultation Done</option>
            <option value="follow_up_pending">Follow-up Pending</option>
            <option value="follow_up_done">Follow-up Done</option>
          </select>
        </div>
      </Section>

      {/* Decision */}
      <Section title="Screening Decision" icon={AlertTriangle} accent={!submitted}>
        <div className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { id: "approved", label: "Approved", cls: "border-emerald-400 bg-emerald-50 text-emerald-800 ring-emerald-400" },
              { id: "on_hold",  label: "On Hold",  cls: "border-rose-400 bg-rose-50 text-rose-800 ring-rose-400" },
            ].map((d) => (
              <button
                key={d.id}
                type="button"
                disabled={submitted}
                onClick={() => setDecision(d.id as ScreeningDecision)}
                className={cn(
                  "flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium transition-all",
                  decision === d.id ? `${d.cls} ring-1` : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                )}
              >
                <div className={cn("h-3 w-3 rounded-full border-2", decision === d.id ? "border-current bg-current" : "border-slate-300")} />
                {d.label}
              </button>
            ))}
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Decision Notes</label>
            <textarea
              value={decisionNotes}
              onChange={(e) => setDecisionNotes(e.target.value)}
              disabled={submitted}
              rows={3}
              placeholder="Clinical rationale, contraindications noted, or reasons for deferment…"
              className={cn(inputCls, "resize-none")}
            />
          </div>
          {submitted && scr?.decisionDate && (
            <p className="text-xs text-slate-400">Decision recorded: {formatDate(scr.decisionDate)}</p>
          )}
        </div>
      </Section>

      {/* Sticky Action Bar */}
      {!submitted && scr && (
        <div className="sticky bottom-4 flex items-center justify-between rounded-lg border border-slate-200 bg-white/90 p-4 shadow-lg backdrop-blur-md">
          <Link href="/screening" className="text-sm font-medium text-slate-500 hover:text-slate-800">
            ← Screening Queue
          </Link>
          <div className="flex items-center gap-3">
            <button onClick={handleSave} className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <Save className="h-4 w-4 text-slate-400" />
              {saved ? "Saved ✓" : "Save Progress"}
            </button>
            <button onClick={handleSubmit} className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700">
              <Send className="h-4 w-4" />
              Submit Screening Decision
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
