"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAppStore } from "@/lib/store/useAppStore";
import { PageHeader } from "@/app/components/shell/PageHeader";
import type { AstroDecision, AstroStatus, AstroCommunicationChannel } from "@/lib/types/astroV2";
import schemaData from "@/data/astro-eligibility-schemas.json";
import wishlistSchema from "@/data/wishlist-schema.json";
import { formatDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import {
  ArrowLeft,
  Star,
  User,
  CheckCircle2,
  Clock,
  Layers,
  MessageSquare,
  Mail,
  Bell,
  Users,
  ChevronDown,
  ChevronUp,
  Save,
  Send,
  AlertTriangle,
  ArrowRight,
  CalendarDays,
} from "lucide-react";

// ─── Badge helpers ────────────────────────────────────────────────────────────

const decisionConfig: Record<AstroDecision, { label: string; cls: string }> = {
  pending:                  { label: "Pending",                  cls: "bg-slate-100 text-slate-700 border-slate-200" },
  requires_review:          { label: "Requires Review",          cls: "bg-amber-50  text-amber-700  border-amber-200" },
  eligible:                 { label: "Eligible",                 cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  not_immediately_eligible: { label: "Not Immediately Eligible", cls: "bg-rose-50   text-rose-700   border-rose-200" },
};

const statusConfig: Record<AstroStatus, { label: string; Icon: React.ElementType }> = {
  pending_preparation:  { label: "Pending Preparation",  Icon: Clock },
  analysis_in_progress: { label: "Analysis In Progress", Icon: Layers },
  evaluation_completed: { label: "Evaluation Completed", Icon: CheckCircle2 },
};

const commChannelConfig: Record<AstroCommunicationChannel, { label: string; Icon: React.ElementType; desc: string }> = {
  patient_whatsapp:        { label: "Patient — WhatsApp",        Icon: MessageSquare, desc: "Notify patient via WhatsApp with eligibility decision." },
  patient_email:           { label: "Patient — Email",           Icon: Mail,          desc: "Send formal eligibility letter to patient email." },
  pracharaka_notification: { label: "Pracharaka Notification",   Icon: Bell,          desc: "Inform referring Pracharaka of the outcome." },
  team_update:             { label: "Sadaika / Ayusurance Team", Icon: Users,         desc: "Record internal team update for case tracking." },
};

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, icon: Icon, children, accent = false }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <section className={cn(
      "rounded-lg border bg-white shadow-sm overflow-hidden",
      accent ? "border-violet-200" : "border-slate-200"
    )}>
      <div className={cn(
        "flex items-center gap-2 border-b px-5 py-3",
        accent ? "border-violet-100 bg-violet-50/60" : "border-slate-100 bg-slate-50/50"
      )}>
        <Icon className={cn("h-4 w-4", accent ? "text-violet-500" : "text-slate-400")} />
        <h2 className={cn("text-sm font-semibold", accent ? "text-violet-800" : "text-slate-800")}>{title}</h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

const inputCls = "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400";

// ─── Main Component ───────────────────────────────────────────────────────────

export function AstroEvaluationPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const {
    astroEligibilityV2ByPatientId,
    patients,
    wishListV2Entries,
    pracharakas,
    updateAstroEvaluation,
    submitAstroDecision,
    logAstroCommunication,
    workflowRecordByPatientId,
  } = useAppStore();

  const record   = astroEligibilityV2ByPatientId(patientId);
  const patient  = patients.find((p) => p.id === patientId);
  const wishList = wishListV2Entries.find((wl) => wl.id === record?.wishListId);
  const pr       = pracharakas.find((p) => p.id === wishList?.pracharakaId);
  const wfRecord = workflowRecordByPatientId(patientId);

  // ── Local form state initialised from store ──
  const [status,                 setStatus]                = useState<AstroStatus>(record?.status ?? "pending_preparation");
  const [healthCycleAnalysis,    setHealthCycleAnalysis]   = useState(record?.healthCycleAnalysis ?? "");
  const [suitabilityStart,       setSuitabilityStart]      = useState(record?.suitabilityPeriodStart ?? "");
  const [suitabilityEnd,         setSuitabilityEnd]        = useState(record?.suitabilityPeriodEnd ?? "");
  const [decision,               setDecision]              = useState<AstroDecision>(record?.decision ?? "pending");
  const [advisoryNote,           setAdvisoryNote]          = useState(record?.advisoryNote ?? "");
  const [preparatoryHealthPlan,  setPreparatoryHealthPlan] = useState(record?.preparatoryHealthPlan ?? "");
  const [consultingVaidyaId,     setConsultingVaidyaId]    = useState(record?.consultingVaidyaId ?? "");
  const [reconsiderationDate,    setReconsiderationDate]   = useState(record?.reconsiderationDate ?? "");
  const [saved,                  setSaved]                 = useState(false);
  const [submitted,              setSubmitted]             = useState(record?.status === "evaluation_completed");
  const [wishListExpanded,       setWishListExpanded]      = useState(false);

  // Re-sync if store record changes (e.g. a communication gets logged)
  useEffect(() => {
    if (record) {
      setStatus(record.status);
      setDecision(record.decision);
      setSubmitted(record.status === "evaluation_completed");
    }
  }, [record]);

  if (!record || !patient) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Star className="mb-3 h-10 w-10 text-slate-300" />
        <p className="text-sm font-medium text-slate-600">Astro evaluation record not found for this patient.</p>
        <p className="text-xs text-slate-400 mt-1">Patient ID: {patientId}</p>
        <Link href="/astro" className="mt-4 text-xs text-violet-600 hover:underline flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" /> Back to Queue
        </Link>
      </div>
    );
  }

  const isDeferred = decision === "not_immediately_eligible";
  const isEligible = decision === "eligible";
  const statusInfo = statusConfig[record.status];
  const StatusIcon = statusInfo.Icon;

  function handleSave() {
    updateAstroEvaluation(record!.id, {
      status,
      healthCycleAnalysis,
      suitabilityPeriodStart: suitabilityStart || undefined,
      suitabilityPeriodEnd:   suitabilityEnd   || undefined,
      advisoryNote:           isDeferred ? advisoryNote          : undefined,
      preparatoryHealthPlan:  isDeferred ? preparatoryHealthPlan : undefined,
      consultingVaidyaId:     isDeferred ? consultingVaidyaId    : undefined,
      reconsiderationDate:    isDeferred ? reconsiderationDate   : undefined,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleSubmitDecision() {
    if (decision === "pending" || decision === "requires_review") {
      alert("Please set a final decision (Eligible or Not Immediately Eligible) before submitting.");
      return;
    }
    handleSave();
    submitAstroDecision(record!.id, decision);
    setSubmitted(true);
  }

  function handleLogComm(channel: AstroCommunicationChannel) {
    const alreadySent = (record!.communications || []).some((c) => c.channel === channel);
    if (alreadySent) return; // idempotent
    logAstroCommunication(record!.id, channel);
  }

  const commSentChannels = new Set((record.communications || []).map((c) => c.channel));

  return (
    <div className="max-w-4xl space-y-5 pb-12">
      {/* Breadcrumb */}
      <Link href="/astro" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Astro Queue
      </Link>

      {/* Page Header */}
      <PageHeader
        title={`Astro Evaluation — ${patient.name}`}
        subtitle={`Record ${record.id} · Linked Wish List ${record.wishListId}`}
      />

      {/* Status Banner */}
      <div className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-lg border px-5 py-3",
        submitted
          ? "border-emerald-200 bg-emerald-50"
          : "border-violet-200 bg-violet-50"
      )}>
        <div className="flex items-center gap-3">
          <span className={cn(
            "inline-flex items-center gap-1.5 rounded border px-2.5 py-0.5 text-xs font-medium",
            statusConfig[record.status].Icon === CheckCircle2
              ? "border-emerald-200 bg-emerald-100 text-emerald-800"
              : "border-violet-200 bg-violet-100 text-violet-800"
          )}>
            <StatusIcon className="h-3.5 w-3.5" />
            {statusConfig[record.status].label}
          </span>
          <span className={cn("inline-flex items-center rounded border px-2.5 py-0.5 text-xs font-medium", decisionConfig[record.decision].cls)}>
            {decisionConfig[record.decision].label}
          </span>
        </div>
        {wfRecord && isEligible && submitted && (
          <Link
            href={`/screening/${patientId}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline"
          >
            Open Screening Record <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>

      {/* Patient / Wish List Context */}
      <Section title="Referred Patient Context" icon={User}>
        <div className="grid gap-3 sm:grid-cols-3 text-sm">
          <Info label="Patient Name"     value={patient.name} />
          <Info label="Patient ID"       value={patient.id} />
          <Info label="Gender"           value={wishList?.data.gender ?? "—"} />
          <Info label="Date of Birth"    value={wishList?.data.dateOfBirth ?? "—"} />
          <Info label="Place of Birth"   value={wishList?.data.placeOfBirth ?? "—"} />
          <Info label="Time of Birth"    value={wishList?.data.timeOfBirth ?? "—"} />
          <Info label="Residence"        value={wishList?.data.placeOfResidence ?? "—"} />
          <Info label="Pracharaka"       value={pr?.name ?? wishList?.pracharakaId ?? "—"} />
          <Info label="Availability"     value={wishList?.data.availabilityTimeframe ?? "—"} />
        </div>

        {/* Expandable full wish list */}
        <button
          onClick={() => setWishListExpanded((v) => !v)}
          className="mt-4 inline-flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800"
        >
          {wishListExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {wishListExpanded ? "Hide" : "Show"} full Wish List details
        </button>

        {wishListExpanded && wishList && (
          <div className="mt-4 space-y-4 rounded-md border border-slate-100 bg-slate-50 p-4">
            {wishlistSchema.sections.map((sec) => (
              <div key={sec.id}>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">{sec.title}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {sec.fields.map((f) => (
                    <Info
                      key={f.id}
                      label={f.label}
                      value={wishList.data[f.id as keyof typeof wishList.data] || "—"}
                      multiline={f.type === "textarea"}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Evaluation Form */}
      <Section title="Astrology Team Evaluation" icon={Star} accent>
        <div className="space-y-5">
          {/* Stage */}
          <div className="max-w-xs">
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Evaluation Stage
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as AstroStatus)}
              disabled={submitted}
              className={inputCls}
            >
              <option value="pending_preparation">Pending Preparation</option>
              <option value="analysis_in_progress">Analysis In Progress</option>
              <option value="evaluation_completed">Evaluation Completed</option>
            </select>
          </div>

          {/* Health Cycle Analysis */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Health Cycle Analysis
              <span className="ml-1 normal-case font-normal text-slate-400">(Astrochart observations, Dasha analysis, health cycles)</span>
            </label>
            <textarea
              value={healthCycleAnalysis}
              onChange={(e) => setHealthCycleAnalysis(e.target.value)}
              disabled={submitted}
              rows={5}
              placeholder="Describe the Mahadasha/Antardasha situation, health sectors activated, planetary health indicators and their implications for Shodhana therapy timing…"
              className={cn(inputCls, "resize-none")}
            />
          </div>

          {/* Suitability Period */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                PK Suitability Period — From
              </label>
              <input
                type="date"
                value={suitabilityStart}
                onChange={(e) => setSuitabilityStart(e.target.value)}
                disabled={submitted}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                PK Suitability Period — Until
              </label>
              <input
                type="date"
                value={suitabilityEnd}
                onChange={(e) => setSuitabilityEnd(e.target.value)}
                disabled={submitted}
                className={inputCls}
              />
            </div>
          </div>

          {/* Final Decision */}
          <div className="rounded-md border border-violet-100 bg-violet-50/50 p-4 space-y-3">
            <label className="block text-[11px] font-bold uppercase tracking-wide text-violet-700">
              Final Eligibility Decision
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              {schemaData.decisionLabels.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  disabled={submitted}
                  onClick={() => setDecision(d.id as AstroDecision)}
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium transition-all",
                    decision === d.id
                      ? d.id === "eligible"
                        ? "border-emerald-400 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-400"
                        : d.id === "not_immediately_eligible"
                          ? "border-rose-400 bg-rose-50 text-rose-800 ring-1 ring-rose-400"
                          : "border-violet-400 bg-violet-50 text-violet-800 ring-1 ring-violet-400"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <div className={cn(
                    "h-3 w-3 rounded-full border-2",
                    decision === d.id ? "border-current bg-current" : "border-slate-300"
                  )} />
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Deferred Outcome Fields — shown only when not immediately eligible */}
      {isDeferred && (
        <Section title="Deferred Patient — Advisory & Preparatory Plan" icon={AlertTriangle}>
          <div className="space-y-4">
            {/* Advisory Template picker */}
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Advisory Note Template
                <span className="ml-1 normal-case font-normal text-slate-400">(select to pre-fill, then edit)</span>
              </label>
              <select
                disabled={submitted}
                onChange={(e) => {
                  const t = schemaData.advisoryTemplates.find((x) => x.id === e.target.value);
                  if (t) setAdvisoryNote(t.content);
                }}
                defaultValue=""
                className={inputCls}
              >
                <option value="">— Select a template —</option>
                {schemaData.advisoryTemplates.map((t) => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Advisory Note <span className="text-red-500">*</span>
              </label>
              <textarea
                value={advisoryNote}
                onChange={(e) => setAdvisoryNote(e.target.value)}
                disabled={submitted}
                rows={4}
                placeholder="Advisory message sent to patient explaining why deferment is necessary and what they should expect…"
                className={cn(inputCls, "resize-none")}
              />
            </div>

            {/* Preparatory Health Plan Template picker */}
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Preparatory Health Plan Template
              </label>
              <select
                disabled={submitted}
                onChange={(e) => {
                  const t = schemaData.preparatoryPlanTemplates.find((x) => x.id === e.target.value);
                  if (t) setPreparatoryHealthPlan(t.content);
                }}
                defaultValue=""
                className={inputCls}
              >
                <option value="">— Select a template —</option>
                {schemaData.preparatoryPlanTemplates.map((t) => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Preparatory Health Plan
              </label>
              <textarea
                value={preparatoryHealthPlan}
                onChange={(e) => setPreparatoryHealthPlan(e.target.value)}
                disabled={submitted}
                rows={4}
                placeholder="Specify dietary protocols, herbal supplements, lifestyle adjustments, and practices to prepare the patient for future treatment…"
                className={cn(inputCls, "resize-none")}
              />
            </div>

            {/* Consulting Vaidya & Reconsideration */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Refer to Consulting Vaidya
                </label>
                <select
                  value={consultingVaidyaId}
                  onChange={(e) => setConsultingVaidyaId(e.target.value)}
                  disabled={submitted}
                  className={inputCls}
                >
                  <option value="">— Not assigned —</option>
                  {schemaData.consultingVaidyas.map((v) => (
                    <option key={v.id} value={v.id}>{v.name} ({v.id})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Reconsideration Date
                </label>
                <input
                  type="date"
                  value={reconsiderationDate}
                  onChange={(e) => setReconsiderationDate(e.target.value)}
                  disabled={submitted}
                  className={inputCls}
                />
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* Communication Console */}
      <Section title="Communication Tracking" icon={MessageSquare}>
        <p className="mb-4 text-xs text-slate-500">
          Mark each required notification as sent. These are status records only — no external API calls are made.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {schemaData.communicationTypes.map((ct) => {
            const channel = ct.id as AstroCommunicationChannel;
            const cfg     = commChannelConfig[channel];
            const sent    = commSentChannels.has(channel);
            const sentLog = (record.communications || []).find((c) => c.channel === channel);
            const CIcon   = cfg.Icon;

            return (
              <div
                key={ct.id}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-3 transition-all",
                  sent
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-slate-200 bg-white"
                )}
              >
                <div className={cn("mt-0.5 rounded-md p-1.5", sent ? "bg-emerald-100" : "bg-slate-100")}>
                  <CIcon className={cn("h-4 w-4", sent ? "text-emerald-700" : "text-slate-500")} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium", sent ? "text-emerald-800" : "text-slate-800")}>{cfg.label}</p>
                  <p className="text-[11px] text-slate-500">{cfg.desc}</p>
                  {sent && sentLog && (
                    <p className="mt-1 text-[10px] text-emerald-600 font-medium">
                      ✓ Sent {formatDate(sentLog.sentAt)}
                    </p>
                  )}
                </div>
                {!sent ? (
                  <button
                    onClick={() => handleLogComm(channel)}
                    className="shrink-0 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                  >
                    Log Sent
                  </button>
                ) : (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                )}
              </div>
            );
          })}
        </div>
        {(record.communications || []).length > 0 && (
          <p className="mt-3 text-xs text-slate-400">
            {(record.communications || []).length} of 4 communications logged
          </p>
        )}
      </Section>

      {/* Astrochart Summary (read-only if completed) */}
      {submitted && (
        <Section title="Evaluation Summary (Completed)" icon={CalendarDays}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Info label="Decision"               value={decisionConfig[record.decision].label} />
            <Info label="Completed At"           value={record.evaluationCompletedAt ? formatDate(record.evaluationCompletedAt) : "—"} />
            {record.suitabilityPeriodStart && <Info label="PK Window — From" value={formatDate(record.suitabilityPeriodStart)} />}
            {record.suitabilityPeriodEnd   && <Info label="PK Window — Until" value={formatDate(record.suitabilityPeriodEnd)} />}
            {record.consultingVaidyaId && (
              <Info
                label="Consulting Vaidya"
                value={schemaData.consultingVaidyas.find((v) => v.id === record.consultingVaidyaId)?.name ?? record.consultingVaidyaId}
              />
            )}
            {record.reconsiderationDate && <Info label="Reconsideration Date" value={formatDate(record.reconsiderationDate)} />}
          </div>
          {record.healthCycleAnalysis && (
            <div className="mt-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Health Cycle Analysis</p>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{record.healthCycleAnalysis}</p>
            </div>
          )}
          {record.advisoryNote && (
            <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 mb-1">Advisory Note</p>
              <p className="text-sm text-amber-800 leading-relaxed whitespace-pre-wrap">{record.advisoryNote}</p>
            </div>
          )}
          {record.preparatoryHealthPlan && (
            <div className="mt-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Preparatory Health Plan</p>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{record.preparatoryHealthPlan}</p>
            </div>
          )}
        </Section>
      )}

      {/* Sticky Action Bar */}
      {!submitted && (
        <div className="sticky bottom-4 mt-8 flex items-center justify-between rounded-lg border border-slate-200 bg-white/90 p-4 shadow-lg backdrop-blur-md">
          <Link href="/astro" className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
            ← Back to Queue
          </Link>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Save className="h-4 w-4 text-slate-400" />
              {saved ? "Saved ✓" : "Save Progress"}
            </button>
            <button
              type="button"
              onClick={handleSubmitDecision}
              className="inline-flex items-center gap-2 rounded-md bg-violet-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-violet-700 focus:outline-none"
            >
              <Send className="h-4 w-4" />
              Submit Decision
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Small read-only field ──────────────────────────────────────────────────────
function Info({ label, value, multiline = false }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div className={multiline ? "col-span-full" : ""}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-0.5">{label}</p>
      <p className={cn("text-sm text-slate-800", !value && "text-slate-400 italic", multiline && "whitespace-pre-wrap leading-relaxed")}>
        {value || "—"}
      </p>
    </div>
  );
}
