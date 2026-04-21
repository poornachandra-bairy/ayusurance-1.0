"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAppStore } from "@/lib/store/useAppStore";
import { useRole } from "@/lib/context/RoleContext";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { formatDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import {
  ArrowLeft, Syringe, User, FileText, CheckCircle2,
  ClipboardList, MessageSquare, Star, Shield, Save, Plus,
} from "lucide-react";

const inputCls = "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-rose-400 focus:outline-none";

const TREATMENT_TABS = ["Overview", "Daily Log", "ACO Checklist", "Post-PK Care", "QC & Feedback"] as const;
type Tab = typeof TREATMENT_TABS[number];

export function ActiveTreatmentDetailPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const {
    patients, pracharakas, arrivalAdmissionRecords,
    treatmentPlanV2Records, qualityChecklists, feedbackRecords,
    initiateQCRecord, toggleQCItem, submitFeedback, feedbackByPatientId, qcByPatientId,
  } = useAppStore();
  const { role } = useRole();

  const patient = patients.find((p) => p.id === patientId);
  const pr      = pracharakas.find((p) => p.id === patient?.pracharakaId);
  const admission = arrivalAdmissionRecords.find((a) => a.patientId === patientId);
  const plan    = treatmentPlanV2Records.find((t) => t.patientId === patientId);
  const qc      = qcByPatientId(patientId);
  const fb      = feedbackByPatientId(patientId);

  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [dailyLog, setDailyLog] = useState<{ date: string; therapies: string; notes: string; vaidyaNote: string }[]>([]);
  const [newLog, setNewLog] = useState({ date: new Date().toISOString().slice(0, 10), therapies: "", notes: "", vaidyaNote: "" });
  const [acoChecklist, setAcoChecklist] = useState<Record<string, boolean>>({});
  const [postPKCare, setPostPKCare] = useState({ dischargeDate: "", medicines: "", dietInstructions: "", followUpDate: "", observations: "" });
  const [saved, setSaved] = useState(false);

  // Feedback state
  const [overallRating, setOverallRating] = useState(fb?.overallRating ?? 0);
  const [npsScore, setNPSScore] = useState(fb?.npsScore ?? 0);
  const [testimonial, setTestimonial] = useState(fb?.testimonial ?? "");
  const [wouldRecommend, setWouldRecommend] = useState(fb?.wouldRecommend ?? false);
  const [fbSaved, setFbSaved] = useState(false);

  const daysSince = admission?.admittedAt
    ? Math.max(0, Math.floor((Date.now() - new Date(admission.admittedAt).getTime()) / 86_400_000))
    : 0;

  const ACO_ITEMS = [
    "Room checked and cleaned", "Meals prepared per diet plan", "Therapy room prepared",
    "Medicine administered on schedule", "Patient check-in completed", "Daily report filed",
  ];

  if (!patient || !admission?.isAdmitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Syringe className="mb-3 h-10 w-10 text-slate-300" />
        <p className="text-sm text-slate-600">Patient not in active treatment or not found.</p>
        <Link href="/active-treatment" className="mt-4 text-xs text-rose-600 hover:underline flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" /> Back
        </Link>
      </div>
    );
  }

  function addDailyLog() {
    if (!newLog.therapies) return;
    setDailyLog((prev) => [{ ...newLog }, ...prev]);
    setNewLog({ date: new Date().toISOString().slice(0, 10), therapies: "", notes: "", vaidyaNote: "" });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  function handleSubmitFeedback() {
    const ratings = { preArrivalCommunication: 0, centreHygiene: 0, therapistSkill: 0, foodQuality: 0, doctorAttention: 0, valueForMoney: 0 };
    submitFeedback({ patientId, overallRating, npsScore, wouldRecommend, testimonial, privateNotes: "", consentToPublish: false, ratings });
    setFbSaved(true); setTimeout(() => setFbSaved(false), 2500);
  }

  return (
    <div className="max-w-4xl space-y-4 pb-16">
      <Link href="/active-treatment" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-3.5 w-3.5" /> Active Treatment
      </Link>

      <PageHeader
        title={`Active Treatment — ${patient.name}`}
        subtitle={`Day ${daysSince + 1} · Admitted ${admission.admittedAt ? formatDate(admission.admittedAt) : "—"}`}
      />

      {/* Quick stats strip */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
        {[
          ["PK Type", plan?.protocol?.panchakarmaType || "—"],
          ["Duration", plan?.protocol?.therapyDuration || "—"],
          ["Treating Vaidya", plan?.treatingVaidyaName || "—"],
          ["Room", admission.roomNumber || "—"],
          ["Pracharaka", pr?.name || "—"],
        ].map(([l, v]) => (
          <div key={l as string} className="flex items-center gap-1.5 border-r border-rose-200 pr-3 last:border-0">
            <p className="text-[10px] text-rose-400 font-semibold uppercase">{l}</p>
            <p className="text-xs font-semibold text-rose-800">{v}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
        {TREATMENT_TABS.map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={cn("flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
              activeTab === t ? "bg-white shadow-sm text-slate-800 font-semibold" : "text-slate-500 hover:text-slate-700")}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "Overview" && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Treatment Protocol</p>
              {plan ? (
                <div className="space-y-1.5">
                  {Object.entries(plan.protocol).slice(0, 8).map(([k, v]) => v ? (
                    <div key={k} className="flex gap-2 text-xs">
                      <span className="text-slate-400 shrink-0 w-28 capitalize">{k.replace(/([A-Z])/g, " $1").trim()}</span>
                      <span className="text-slate-700 font-medium">{v}</span>
                    </div>
                  ) : null)}
                </div>
              ) : <p className="text-xs italic text-slate-400">No treatment plan found.</p>}
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Admission Notes</p>
              <div className="space-y-1.5">
                {[
                  ["Admitted On", admission.admittedAt ? formatDate(admission.admittedAt) : "—"],
                  ["Room", admission.roomNumber || "—"],
                  ["Schedule Confirmed", admission.scheduleConfirmed ? "Yes" : "No"],
                  ["Consent Signed", admission.consentSigned ? "Yes" : "No"],
                ].map(([l, v]) => (
                  <div key={l as string} className="flex justify-between text-xs">
                    <span className="text-slate-400">{l}</span>
                    <span className="text-slate-700 font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Medicine list */}
          {plan && (plan.medicineCategories || []).some((c) => c.medicines.length > 0) && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Medicine List</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {plan.medicineCategories.filter((c) => c.medicines.length > 0).map((cat) => (
                  <div key={cat.categoryId}>
                    <p className="mb-1 text-[10px] font-bold uppercase text-slate-400">{cat.categoryId.replace(/_/g, " ")}</p>
                    {cat.medicines.map((m) => (
                      <div key={m.id} className="ml-2 text-xs text-slate-700">• {m.name} {m.dosage && `— ${m.dosage}`}</div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "Daily Log" && (
        <div className="space-y-4">
          {/* New entry */}
          <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 space-y-3">
            <p className="text-xs font-semibold text-rose-700 uppercase tracking-wide">Add Today's Log</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-500 uppercase">Date</label>
                <input type="date" value={newLog.date} onChange={(e) => setNewLog((p) => ({ ...p, date: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-500 uppercase">Therapies Administered</label>
                <input placeholder="e.g. Abhyanga, Shirodhara…" value={newLog.therapies} onChange={(e) => setNewLog((p) => ({ ...p, therapies: e.target.value }))} className={inputCls} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-500 uppercase">ACO Notes</label>
              <input placeholder="Meals, room, patient mood…" value={newLog.notes} onChange={(e) => setNewLog((p) => ({ ...p, notes: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-500 uppercase">Vaidya Clinical Note</label>
              <textarea placeholder="Clinical observations, protocol adjustments…" value={newLog.vaidyaNote} onChange={(e) => setNewLog((p) => ({ ...p, vaidyaNote: e.target.value }))} rows={2} className={cn(inputCls, "resize-none")} />
            </div>
            <button onClick={addDailyLog} className="inline-flex items-center gap-2 rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700">
              <Plus className="h-4 w-4" />{saved ? "Saved ✓" : "Add Entry"}
            </button>
          </div>

          {/* Log entries */}
          {dailyLog.length === 0 ? (
            <p className="text-center text-sm italic text-slate-400 py-8">No daily log entries yet. Add the first entry above.</p>
          ) : (
            <div className="space-y-3">
              {dailyLog.map((entry, i) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-slate-600">{formatDate(entry.date)}</span>
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-medium text-rose-700">Day {daysSince + 1 - i}</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-xs"><span className="text-slate-400">Therapies: </span><span className="text-slate-700 font-medium">{entry.therapies}</span></div>
                    {entry.notes && <div className="text-xs"><span className="text-slate-400">ACO Note: </span><span className="text-slate-700">{entry.notes}</span></div>}
                    {entry.vaidyaNote && <div className="text-xs bg-indigo-50 rounded p-2 border border-indigo-100"><span className="text-indigo-500 font-semibold">Vaidya: </span><span className="text-indigo-800">{entry.vaidyaNote}</span></div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "ACO Checklist" && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3">
            <p className="text-sm font-semibold text-slate-800">Daily ACO Operational Checklist</p>
            <p className="text-[11px] text-slate-400">Complete each item daily to maintain center standards</p>
          </div>
          <div className="px-4 py-3 space-y-2">
            {ACO_ITEMS.map((item) => (
              <button key={item} onClick={() => setAcoChecklist((p) => ({ ...p, [item]: !p[item] }))}
                className={cn("flex w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-sm transition-all",
                  acoChecklist[item] ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50")}>
                <div className={cn("h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center",
                  acoChecklist[item] ? "border-emerald-500 bg-emerald-500" : "border-slate-300")}>
                  {acoChecklist[item] && <CheckCircle2 className="h-3 w-3 text-white" />}
                </div>
                <span className={cn("font-medium", acoChecklist[item] ? "text-emerald-800" : "text-slate-700")}>{item}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === "Post-PK Care" && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3">
            <p className="text-sm font-semibold text-slate-800">Post-PK Discharge & Care Plan</p>
          </div>
          <div className="px-5 py-4 space-y-3">
            {[
              { id: "dischargeDate", label: "Discharge Date", type: "date" },
              { id: "followUpDate", label: "Follow-up Date", type: "date" },
            ].map((f) => (
              <div key={f.id}>
                <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-500">{f.label}</label>
                <input type={f.type} value={(postPKCare as any)[f.id]} onChange={(e) => setPostPKCare((p) => ({ ...p, [f.id]: e.target.value }))} className={inputCls} />
              </div>
            ))}
            {[
              { id: "medicines", label: "Post-PK Medicines & Dosage", placeholder: "List medicines and dosage schedule…" },
              { id: "dietInstructions", label: "Diet Instructions", placeholder: "Foods to avoid, recommended diet…" },
              { id: "observations", label: "Clinical Observations", placeholder: "Notes on patient's condition at discharge…" },
            ].map((f) => (
              <div key={f.id}>
                <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-500">{f.label}</label>
                <textarea value={(postPKCare as any)[f.id]} onChange={(e) => setPostPKCare((p) => ({ ...p, [f.id]: e.target.value }))} rows={3} placeholder={f.placeholder} className={cn(inputCls, "resize-none")} />
              </div>
            ))}
            <button className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <Save className="h-4 w-4 text-slate-400" /> Save Care Plan
            </button>
          </div>
        </div>
      )}

      {activeTab === "QC & Feedback" && (
        <div className="space-y-4">
          {/* QC Link */}
          <Link href={`/quality-control/${patientId}`}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:bg-slate-50 transition-colors">
            <div className="rounded-lg bg-amber-50 p-2"><Shield className="h-5 w-5 text-amber-600" /></div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-800">Quality Control Checklist</p>
              <p className="text-xs text-slate-400">6-stage QC review across all workflow dimensions</p>
            </div>
            <ArrowLeft className="h-4 w-4 rotate-180 text-slate-300" />
          </Link>

          {/* Feedback */}
          <div className="rounded-xl border border-amber-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-amber-100 bg-amber-50/60 px-5 py-3 flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              <p className="text-sm font-semibold text-amber-800">Patient Feedback</p>
              {fb && <span className="ml-auto text-xs text-amber-600">Submitted</span>}
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase text-slate-500">Overall Rating</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map((r) => (
                    <button key={r} disabled={!!fb} onClick={() => setOverallRating(r)}
                      className={cn("h-9 w-9 rounded-md text-sm font-bold transition-colors",
                        overallRating >= r ? "bg-amber-400 text-white" : "bg-slate-100 text-slate-400 hover:bg-amber-100",
                        fb && "cursor-default")}>
                      {r}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase text-slate-500">NPS Score (0–10)</label>
                <div className="flex flex-wrap gap-1">
                  {Array.from({length:11},(_,i)=>i).map((n) => (
                    <button key={n} disabled={!!fb} onClick={() => setNPSScore(n)}
                      className={cn("h-8 w-8 rounded text-xs font-bold",
                        npsScore === n ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                        fb && "cursor-default")}>
                      {n}</button>
                  ))}
                </div>
              </div>
              <textarea value={testimonial} disabled={!!fb} onChange={(e) => setTestimonial(e.target.value)}
                rows={3} placeholder="Patient testimonial…" className={cn(inputCls, "resize-none")} />
              {!fb && (
                <button onClick={handleSubmitFeedback}
                  className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700">
                  <Star className="h-4 w-4" />{fbSaved ? "Saved ✓" : "Submit Feedback"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
