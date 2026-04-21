"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAppStore } from "@/lib/store/useAppStore";
import { PageHeader } from "@/app/components/shell/PageHeader";
import type { FeedbackRecord } from "@/lib/types/index";
import qcStageDefs from "@/data/qc-stage-definitions.json";
import { formatDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import { ArrowLeft, Shield, Star, CheckCircle2, Save, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";

const inputCls = "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-slate-400 focus:outline-none";

const RATINGS = [1, 2, 3, 4, 5];

export function QCDetailPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const {
    patients, qcByPatientId, feedbackByPatientId,
    initiateQCRecord, toggleQCItem, updateQCRecord, submitFeedback,
    addAuditNote, actionLogsByPatientId,
  } = useAppStore();

  const patient = patients.find((p) => p.id === patientId);

  useEffect(() => {
    if (patient && !qcByPatientId(patientId)) initiateQCRecord(patientId);
  }, [patient, patientId]);

  const qc       = qcByPatientId(patientId);
  const feedback = feedbackByPatientId(patientId);
  const logs     = actionLogsByPatientId(patientId);

  // QC state
  const [reviewedBy, setReviewedBy] = useState(qc?.reviewedBy ?? "");
  const [notes,      setNotes]      = useState(qc?.additionalNotes ?? "");
  const [qcSaved,    setQCSaved]    = useState(false);

  // Feedback state (single record per patient)
  const [overallRating,   setOverallRating]   = useState(feedback?.overallRating ?? 0);
  const [npsScore,        setNPSScore]        = useState(feedback?.npsScore ?? 0);
  const [wouldRecommend,  setWouldRecommend]  = useState(feedback?.wouldRecommend ?? false);
  const [testimonial,     setTestimonial]     = useState(feedback?.testimonial ?? "");
  const [ratings, setRatings] = useState<{
    preArrivalCommunication: number; centreHygiene: number; therapistSkill: number;
    foodQuality: number; doctorAttention: number; valueForMoney: number;
  }>(feedback?.ratings ?? {
    preArrivalCommunication: 0, centreHygiene: 0, therapistSkill: 0,
    foodQuality: 0, doctorAttention: 0, valueForMoney: 0,
  });
  const [feedbackSaved, setFeedbackSaved] = useState(false);

  // Audit note
  const [auditNote, setAuditNote] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (qc) { setReviewedBy(qc.reviewedBy ?? ""); setNotes(qc.additionalNotes ?? ""); }
  }, [qc?.id]);
  useEffect(() => {
    if (feedback) { setOverallRating(feedback.overallRating); setNPSScore(feedback.npsScore); setWouldRecommend(feedback.wouldRecommend); setTestimonial(feedback.testimonial ?? ""); setRatings(feedback.ratings); }
  }, [feedback?.id]);

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield className="mb-3 h-10 w-10 text-slate-300" />
        <p className="text-sm text-slate-600">Patient not found</p>
        <Link href="/quality-control" className="mt-4 text-xs text-slate-500 hover:underline flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" /> Back
        </Link>
      </div>
    );
  }

  function handleSaveQC() {
    if (!qc) return;
    updateQCRecord(patientId, { reviewedBy, additionalNotes: notes });
    setQCSaved(true); setTimeout(() => setQCSaved(false), 2500);
  }

  function handleSubmitFeedback() {
    submitFeedback({ patientId, overallRating, npsScore, wouldRecommend, testimonial, privateNotes: "", consentToPublish: false, ratings });
    setFeedbackSaved(true); setTimeout(() => setFeedbackSaved(false), 2500);
  }

  function handleAddAuditNote() {
    if (!auditNote.trim()) return;
    addAuditNote(patientId, auditNote, reviewedBy || "Ops Team");
    setAuditNote("");
  }

  function RatingRow({ field, label }: { field: keyof typeof ratings; label: string }) {
    return (
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-slate-600 flex-1">{label}</span>
        <div className="flex gap-1">
          {RATINGS.map((r) => (
            <button key={r} type="button" onClick={() => !feedback && setRatings((prev) => ({ ...prev, [field]: r }))}
              className={cn("h-6 w-6 rounded text-xs font-bold transition-colors",
                ratings[field] >= r ? "bg-amber-400 text-white" : "bg-slate-100 text-slate-400 hover:bg-amber-100")}>
              {r}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Compute totals
  const totalItems = qcStageDefs.qcStages.reduce((s, st) => s + st.items.length, 0);
  const totalDone  = qcStageDefs.qcStages.reduce((s, st) =>
    s + st.items.filter((i) => qc?.checklistItems[`${st.id}::${i.id}`]).length, 0
  );
  const pct = totalItems > 0 ? Math.round((totalDone / totalItems) * 100) : 0;

  return (
    <div className="max-w-4xl space-y-5 pb-16">
      <Link href="/quality-control" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-3.5 w-3.5" /> Quality Control
      </Link>

      <PageHeader title={`QC Review — ${patient.name}`} subtitle={`Record ${qc?.id ?? "…"} · ${pct}% complete`} />

      {/* Overall progress */}
      <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white px-5 py-3 shadow-sm">
        <div className="h-2 flex-1 rounded-full bg-slate-100 overflow-hidden">
          <div className={cn("h-full rounded-full transition-all", pct === 100 ? "bg-emerald-500" : "bg-slate-500")} style={{ width: `${pct}%` }} />
        </div>
        <span className="text-sm font-bold text-slate-800">{pct}%</span>
        <span className="text-xs text-slate-500">{totalDone}/{totalItems} items</span>
      </div>

      {/* QC Stage Checklists */}
      {qcStageDefs.qcStages.map((stage) => {
        const stageDone = stage.items.filter((i) => qc?.checklistItems[`${stage.id}::${i.id}`]).length;
        const stagePct  = Math.round((stageDone / stage.items.length) * 100);
        const isExp     = expanded[stage.id] !== false; // default expanded

        return (
          <div key={stage.id} className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
            <button type="button" onClick={() => setExpanded((p) => ({ ...p, [stage.id]: !isExp }))}
              className="flex w-full items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/50 px-5 py-3 text-left hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">{stage.label}</p>
                  <p className="text-[11px] text-slate-400">{stage.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={cn("text-xs font-bold", stagePct === 100 ? "text-emerald-700" : "text-slate-600")}>{stagePct}%</span>
                <div className="h-1.5 w-16 rounded-full bg-slate-200 overflow-hidden">
                  <div className={cn("h-full rounded-full", stagePct === 100 ? "bg-emerald-500" : "bg-slate-400")} style={{ width: `${stagePct}%` }} />
                </div>
                {isExp ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
              </div>
            </button>
            {isExp && (
              <div className="px-5 py-3 space-y-2">
                {stage.items.map((item) => {
                  const key     = `${stage.id}::${item.id}`;
                  const checked = qc?.checklistItems[key] ?? false;
                  return (
                    <button key={item.id} type="button" onClick={() => toggleQCItem(patientId, stage.id, item.id)}
                      className={cn("flex w-full items-center gap-3 rounded-md border px-4 py-2.5 text-left text-sm transition-all",
                        checked ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50")}>
                      <div className={cn("h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center",
                        checked ? "border-emerald-500 bg-emerald-500" : "border-slate-300")}>
                        {checked && <CheckCircle2 className="h-3 w-3 text-white" />}
                      </div>
                      <p className={cn("font-medium text-sm", checked ? "text-emerald-800" : "text-slate-700")}>{item.label}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* QC Notes */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/50 px-5 py-3">
          <Shield className="h-4 w-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-800">QC Review Notes</h2>
        </div>
        <div className="space-y-3 px-5 py-4">
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Reviewed By</label>
            <input value={reviewedBy} onChange={(e) => setReviewedBy(e.target.value)} placeholder="Reviewer name…" className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Additional Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Any deviations, special observations, or comments…" className={cn(inputCls, "resize-none")} />
          </div>
          <button onClick={handleSaveQC} className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Save className="h-4 w-4 text-slate-400" />{qcSaved ? "Saved ✓" : "Save QC Record"}
          </button>
        </div>
      </div>

      {/* Patient Feedback */}
      <div className="rounded-lg border border-amber-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 border-b border-amber-100 bg-amber-50/60 px-5 py-3">
          <Star className="h-4 w-4 text-amber-500" />
          <h2 className="text-sm font-semibold text-amber-800">Patient Feedback</h2>
          {feedback && <span className="ml-auto text-xs text-amber-600">Submitted {formatDate(feedback.submittedAt)}</span>}
        </div>
        <div className="space-y-4 px-5 py-4">
          {/* Overall Rating */}
          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Overall Rating</label>
            <div className="flex gap-2">
              {RATINGS.map((r) => (
                <button key={r} type="button" onClick={() => !feedback && setOverallRating(r)}
                  className={cn("h-9 w-9 rounded-md text-sm font-bold transition-colors",
                    overallRating >= r ? "bg-amber-400 text-white" : "bg-slate-100 text-slate-400 hover:bg-amber-100",
                    feedback && "cursor-default")}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Rating breakdown */}
          <div className="space-y-2">
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Detailed Ratings</label>
            <RatingRow field="preArrivalCommunication" label="Pre-arrival communication" />
            <RatingRow field="centreHygiene" label="Centre cleanliness & hygiene" />
            <RatingRow field="therapistSkill" label="Therapist skill & professionalism" />
            <RatingRow field="foodQuality" label="Food quality" />
            <RatingRow field="doctorAttention" label="Doctor attention" />
            <RatingRow field="valueForMoney" label="Value for money" />
          </div>

          {/* NPS */}
          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">NPS Score (0–10)</label>
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: 11 }, (_, i) => i).map((n) => (
                <button key={n} type="button" onClick={() => !feedback && setNPSScore(n)}
                  className={cn("h-8 w-8 rounded text-xs font-bold transition-colors",
                    npsScore === n ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                    feedback && "cursor-default")}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Would recommend */}
          <button type="button" onClick={() => !feedback && setWouldRecommend((v) => !v)}
            className={cn("flex items-center gap-3 rounded-md border px-4 py-2.5 text-sm font-medium transition-all",
              wouldRecommend ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
              feedback && "cursor-default")}>
            <div className={cn("h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center",
              wouldRecommend ? "border-emerald-500 bg-emerald-500" : "border-slate-300")}>
              {wouldRecommend && <CheckCircle2 className="h-3 w-3 text-white" />}
            </div>
            Would recommend to others
          </button>

          {/* Testimonial */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Testimonial</label>
            <textarea value={testimonial} onChange={(e) => setTestimonial(e.target.value)} disabled={!!feedback} rows={3}
              placeholder="Patient's own words about their experience…" className={cn(inputCls, "resize-none")} />
          </div>

          {!feedback && (
            <button onClick={handleSubmitFeedback} className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-5 py-2 text-sm font-medium text-white hover:bg-amber-700">
              <Star className="h-4 w-4" /> Submit Feedback
            </button>
          )}
          {feedbackSaved && <p className="text-xs text-emerald-600">Feedback submitted ✓</p>}
        </div>
      </div>

      {/* Audit Trail */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/50 px-5 py-3">
          <MessageSquare className="h-4 w-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-800">Audit Notes & Trail</h2>
          <span className="ml-auto text-xs text-slate-400">{logs.length} entries</span>
        </div>
        <div className="px-5 py-4">
          {/* Add note */}
          <div className="mb-4 flex gap-2">
            <input value={auditNote} onChange={(e) => setAuditNote(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddAuditNote()}
              placeholder="Add audit note… (Enter to submit)"
              className="flex-1 h-9 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:border-slate-400 focus:bg-white focus:outline-none" />
            <button onClick={handleAddAuditNote} className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-900">Add</button>
          </div>

          {/* Log entries */}
          {logs.length === 0 ? (
            <p className="text-xs italic text-slate-400">No log entries yet.</p>
          ) : (
            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {logs.slice(0, 50).map((log) => (
                <div key={log.id} className={cn("flex gap-3 rounded-md border px-3 py-2",
                  (log as any).isAudit ? "border-amber-100 bg-amber-50" : "border-slate-100 bg-slate-50")}>
                  <div className="shrink-0 w-24 text-[10px] text-slate-400 leading-tight pt-0.5">{formatDate(log.timestamp)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-slate-500">{log.role}</span>
                      <span className={cn("text-[10px] rounded px-1 py-0.5",
                        (log as any).isAudit ? "bg-amber-100 text-amber-700" : "bg-slate-200 text-slate-600")}>{log.noteType}</span>
                    </div>
                    <p className="text-xs text-slate-700 mt-0.5">{log.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
