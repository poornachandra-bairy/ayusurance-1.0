"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAppStore } from "@/lib/store/useAppStore";
import { PageHeader } from "@/app/components/shell/PageHeader";
import type { PaymentMode } from "@/lib/types/travelAdmissionV2";
import travelTasks   from "@/data/travel-tasks.json";
import paymentModes  from "@/data/payment-modes.json";
import admissionData from "@/data/admission-checklist.json";
import requiredDocs  from "@/data/required-documents.json";
import { formatDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import {
  ArrowLeft, Plane, CreditCard, LogIn, FileText,
  CheckCircle2, Clock, Save, Send, DollarSign,
  AlertCircle, User, Globe,
} from "lucide-react";

// ─── Shared primitives ───────────────────────────────────────────────────────

const inputCls = "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 disabled:bg-slate-50 disabled:text-slate-400";

const TAB_IDS = ["travel", "payment", "admission", "documents"] as const;
type TabId = typeof TAB_IDS[number];

const TABS: { id: TabId; label: string; Icon: React.ElementType }[] = [
  { id: "travel",    label: "Travel Preparation",  Icon: Plane      },
  { id: "payment",   label: "Payment",              Icon: CreditCard },
  { id: "admission", label: "Arrival & Admission",  Icon: LogIn      },
  { id: "documents", label: "Required Documents",   Icon: FileText   },
];

function Card({ title, icon: Icon, children, color = "slate" }: {
  title: string; icon: React.ElementType; children: React.ReactNode; color?: "slate" | "blue" | "emerald" | "rose";
}) {
  const colors = {
    slate:   { border: "border-slate-200",   bg: "bg-slate-50/50",    icon: "text-slate-400",   head: "text-slate-800" },
    blue:    { border: "border-blue-200",    bg: "bg-blue-50/60",     icon: "text-blue-500",    head: "text-blue-800" },
    emerald: { border: "border-emerald-200", bg: "bg-emerald-50/60",  icon: "text-emerald-600", head: "text-emerald-800" },
    rose:    { border: "border-rose-200",    bg: "bg-rose-50/60",     icon: "text-rose-500",    head: "text-rose-800" },
  };
  const c = colors[color];
  return (
    <section className={cn("rounded-lg border bg-white shadow-sm overflow-hidden", c.border)}>
      <div className={cn("flex items-center gap-2 border-b px-5 py-3", c.bg, c.border)}>
        <Icon className={cn("h-4 w-4", c.icon)} />
        <h2 className={cn("text-sm font-semibold", c.head)}>{title}</h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

function CheckRow({ label, description, checked, onToggle, disabled, timestamp }: {
  label: string; description?: string; checked: boolean; onToggle?: () => void; disabled?: boolean; timestamp?: string;
}) {
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
      <div className="flex-1">
        <p className={cn("font-medium text-sm", checked ? "text-emerald-800" : "text-slate-700")}>{label}</p>
        {description && <p className="text-[11px] text-slate-400 mt-0.5">{description}</p>}
        {timestamp && <p className="text-[10px] text-emerald-600 mt-0.5">Completed {formatDate(timestamp)}</p>}
      </div>
    </button>
  );
}

function ModeButton({ mode, selected, onSelect, disabled }: { mode: typeof paymentModes.modes[number]; selected: boolean; onSelect: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onSelect} disabled={disabled}
      className={cn("flex flex-col gap-0.5 rounded-md border px-3 py-2.5 text-left text-sm transition-all",
        selected ? "border-blue-400 bg-blue-50 ring-1 ring-blue-400" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
        disabled && "cursor-default opacity-70"
      )}>
      <span className={cn("font-semibold text-sm", selected ? "text-blue-800" : "text-slate-800")}>{mode.label}</span>
      <span className="text-[11px] text-slate-400">{mode.description}</span>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function TravelAdmissionPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const [tab, setTab] = useState<TabId>("travel");

  const {
    patients, pracharakas,
    portalOnboardingV2ByPatientId, reservationV2ByPatientId,
    travelPrepByPatientId, paymentRecordByPatientId,
    arrivalAdmissionByPatientId, patientDocumentsByPatientId,
    initiateTravelPrep, updateTravelPrep, toggleTravelTask, completeTravelPrep,
    initiatePaymentRecord, confirmAdvancePayment, confirmFinalPayment, updatePaymentRecord,
    initiateArrivalAdmission, toggleAdmissionItem, updateArrivalAdmission, admitPatient,
    initiatePatientDocuments, updateDocumentStatus,
  } = useAppStore();

  const patient  = patients.find((p) => p.id === patientId);
  const pr       = pracharakas.find((p) => p.id === patient?.pracharakaId);
  const pob      = portalOnboardingV2ByPatientId(patientId);
  const res      = reservationV2ByPatientId(patientId);
  const isIntl   = res?.isInternationalPatient ?? false;

  // Auto-initiate all records
  useEffect(() => {
    if (!patient) return;
    if (pob && !travelPrepByPatientId(patientId))
      initiateTravelPrep(patientId, pob.id, isIntl);
  }, [patient, pob, patientId]);

  const trv  = travelPrepByPatientId(patientId);

  useEffect(() => {
    if (trv && !paymentRecordByPatientId(patientId))
      initiatePaymentRecord(patientId, trv.id);
  }, [trv, patientId]);

  const pay  = paymentRecordByPatientId(patientId);

  useEffect(() => {
    if (pay && !arrivalAdmissionByPatientId(patientId))
      initiateArrivalAdmission(patientId, pay.id);
  }, [pay, patientId]);

  useEffect(() => {
    if (patient && res && !patientDocumentsByPatientId(patientId))
      initiatePatientDocuments(patientId, isIntl);
  }, [patient, res, patientId]);

  const adm  = arrivalAdmissionByPatientId(patientId);
  const docs = patientDocumentsByPatientId(patientId);

  // ── Travel local state ───────────────────────────────────────────────────
  const [arrivalDate,       setArrivalDate]       = useState(trv?.arrivalDate ?? "");
  const [flightDetails,     setFlightDetails]     = useState(trv?.flightDetails ?? "");
  const [travelInsRef,      setTravelInsRef]      = useState(trv?.travelInsuranceRef ?? "");
  const [medInsRef,         setMedInsRef]         = useState(trv?.medicalInsuranceRef ?? "");
  const [trvSaved,          setTrvSaved]          = useState(false);

  // ── Payment local state ──────────────────────────────────────────────────
  const [advMode,  setAdvMode]  = useState<PaymentMode>(pay?.advanceMode ?? "wire_transfer");
  const [advAmt,   setAdvAmt]   = useState(pay?.advanceAmountUSD?.toString() ?? "");
  const [advRef,   setAdvRef]   = useState(pay?.advanceReference ?? "");
  const [finMode,  setFinMode]  = useState<PaymentMode>(pay?.declaredPaymentMode ?? pay?.finalMode ?? "wire_transfer");
  const [finAmt,   setFinAmt]   = useState(pay?.finalAmountUSD?.toString() ?? "");
  const [finRef,   setFinRef]   = useState(pay?.finalReference ?? "");
  const [paySaved, setPaySaved] = useState(false);

  // ── Admission local state ────────────────────────────────────────────────
  const [acoName,    setAcoName]    = useState(adm?.acoName ?? "");
  const [acoArrDate, setAcoArrDate] = useState(adm?.arrivalActualDate?.slice(0, 10) ?? "");
  const [admSaved,   setAdmSaved]   = useState(false);

  // sync on record creation
  useEffect(() => {
    if (trv) { setArrivalDate(trv.arrivalDate ?? ""); setFlightDetails(trv.flightDetails ?? ""); setTravelInsRef(trv.travelInsuranceRef ?? ""); setMedInsRef(trv.medicalInsuranceRef ?? ""); }
  }, [trv?.id]);
  useEffect(() => {
    if (pay) { setAdvMode(pay.advanceMode ?? "wire_transfer"); setAdvAmt(pay.advanceAmountUSD?.toString() ?? ""); setAdvRef(pay.advanceReference ?? ""); setFinMode(pay.declaredPaymentMode ?? pay.finalMode ?? "wire_transfer"); setFinAmt(pay.finalAmountUSD?.toString() ?? ""); setFinRef(pay.finalReference ?? ""); }
  }, [pay?.id]);
  useEffect(() => {
    if (adm) { setAcoName(adm.acoName ?? ""); setAcoArrDate(adm.arrivalActualDate?.slice(0,10) ?? ""); }
  }, [adm?.id]);

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Plane className="mb-3 h-10 w-10 text-slate-300" />
        <p className="text-sm text-slate-600">Patient not found: {patientId}</p>
        <Link href="/travel-payment" className="mt-4 text-xs text-slate-500 hover:underline flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" /> Back
        </Link>
      </div>
    );
  }

  // Computed status indicators
  const trvDone      = (trv?.tasks || []).filter((t) => t.done).length ?? 0;
  const trvTotal     = trvTasks().length;
  const trvPct       = trvTotal > 0 ? Math.round((trvDone / trvTotal) * 100) : 0;
  const payStatus    = pay?.advancePaid && pay?.finalPaid ? "paid" : pay?.advancePaid ? "partial" : "not_paid";
  const admDone      = (adm?.admissionChecklist || []).filter((a) => a.done).length ?? 0;
  const admTotal     = admissionData.items.length;
  const docSubmitted = (docs?.documents || []).filter((d) => d.status !== "not_submitted").length ?? 0;
  const docTotal     = docs?.documents.length ?? 0;

  function trvTasks() { return trv?.tasks ?? []; }

  function handleSaveTravel() {
    if (!trv) return;
    updateTravelPrep(trv.id, { arrivalDate: arrivalDate || undefined, flightDetails: flightDetails || undefined, travelInsuranceRef: travelInsRef || undefined, medicalInsuranceRef: medInsRef || undefined });
    setTrvSaved(true); setTimeout(() => setTrvSaved(false), 2500);
  }

  function handleCompleteTravelPrep() {
    handleSaveTravel();
    if (trv) completeTravelPrep(trv.id);
  }

  function handleAdvancePayment() {
    if (!pay) return;
    confirmAdvancePayment(pay.id, advMode, advRef || undefined, advAmt ? parseFloat(advAmt) : undefined);
  }

  function handleFinalPayment() {
    if (!pay) return;
    confirmFinalPayment(pay.id, finMode, finRef || undefined, finAmt ? parseFloat(finAmt) : undefined);
  }

  function handleDeclareMode() {
    if (!pay) return;
    updatePaymentRecord(pay.id, { declaredPaymentMode: finMode });
    setPaySaved(true); setTimeout(() => setPaySaved(false), 2500);
  }

  function handleSaveAdmission() {
    if (!adm) return;
    updateArrivalAdmission(adm.id, { acoName: acoName || undefined, arrivalActualDate: acoArrDate || undefined });
    setAdmSaved(true); setTimeout(() => setAdmSaved(false), 2500);
  }

  function handleAdmit() {
    handleSaveAdmission();
    if (adm) admitPatient(adm.id);
  }

  function cycleDocStatus(docId: string) {
    if (!docs) return;
    const doc = docs.documents.find((d) => d.docId === docId);
    const next = { not_submitted: "submitted", submitted: "verified", verified: "rejected", rejected: "not_submitted" } as const;
    const nowStatus = (next as any)[doc?.status ?? "not_submitted"];
    updateDocumentStatus(docs.id, docId, {
      status: nowStatus,
      submittedAt: nowStatus === "submitted" ? new Date().toISOString() : doc?.submittedAt,
      verifiedAt:  nowStatus === "verified"  ? new Date().toISOString() : undefined,
    });
  }

  const docStatusConfig = {
    not_submitted: { label: "Not Submitted", cls: "bg-slate-100 text-slate-500 border-slate-200" },
    submitted:     { label: "Submitted",      cls: "bg-blue-50 text-blue-700 border-blue-200" },
    verified:      { label: "Verified",       cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    rejected:      { label: "Rejected",       cls: "bg-rose-50 text-rose-700 border-rose-200" },
  };

  const applicableReqDocs = requiredDocs.documents.filter((d) =>
    isIntl ? d.requiredForInternational : d.requiredForDomestic
  );

  return (
    <div className="max-w-4xl space-y-5 pb-16">
      <Link href="/travel-payment" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-3.5 w-3.5" /> Travel & Payment Queue
      </Link>

      <PageHeader
        title={`Travel & Admission — ${patient.name}`}
        subtitle={`${isIntl ? "International" : "Domestic"} Patient · ${pr?.name ? `Pracharaka: ${pr.name}` : patientId}`}
      />

      {/* Summary Banner */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Travel Tasks",  value: `${trvDone}/${trvTotal}`,    done: trvPct === 100,   Icon: Plane      },
          { label: "Payment",       value: payStatus.replace(/_/g, " "), done: payStatus==="paid",Icon: CreditCard },
          { label: "Admission",     value: `${admDone}/${admTotal}`,     done: adm?.isAdmitted,  Icon: LogIn      },
          { label: "Documents",     value: `${docSubmitted}/${docTotal}`,done: docSubmitted===docTotal && docTotal>0, Icon: FileText },
        ].map(({ label, value, done, Icon }) => (
          <div key={label} className={cn("rounded-lg border p-3 flex items-center gap-3",
            done ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white")}>
            <Icon className={cn("h-4 w-4 shrink-0", done ? "text-emerald-600" : "text-slate-400")} />
            <div>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">{label}</p>
              <p className={cn("text-sm font-bold", done ? "text-emerald-800" : "text-slate-800")}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 overflow-x-auto">
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={cn("flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-all",
                tab === id
                  ? "border-slate-800 text-slate-900 bg-slate-50/50"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              )}>
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-5">

          {/* ── TRAVEL ── */}
          {tab === "travel" && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Confirmed Arrival Date</label>
                  <input type="date" value={arrivalDate} onChange={(e) => setArrivalDate(e.target.value)} disabled={trv?.isComplete} className={inputCls} />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Flight Details / Booking Ref</label>
                  <input value={flightDetails} onChange={(e) => setFlightDetails(e.target.value)} disabled={trv?.isComplete} placeholder="Flight number, airline, booking code…" className={inputCls} />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Travel Insurance Reference</label>
                  <input value={travelInsRef} onChange={(e) => setTravelInsRef(e.target.value)} disabled={trv?.isComplete} placeholder="Policy number or provider…" className={inputCls} />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Medical Insurance Reference</label>
                  <input value={medInsRef} onChange={(e) => setMedInsRef(e.target.value)} disabled={trv?.isComplete} placeholder="Policy number or provider…" className={inputCls} />
                </div>
              </div>

              <div className="space-y-2">
                {travelTasks.tasks.map((task) => {
                  const status = (trv?.tasks || []).find((t) => t.taskId === task.id);
                  return (
                    <CheckRow key={task.id} label={task.label} description={task.description}
                      checked={status?.done ?? false} timestamp={status?.doneAt}
                      onToggle={() => trv && !trv.isComplete && toggleTravelTask(trv.id, task.id)}
                      disabled={trv?.isComplete} />
                  );
                })}
              </div>

              {!trv?.isComplete && (
                <div className="flex items-center gap-3 pt-2">
                  <button onClick={handleSaveTravel} className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                    <Save className="h-4 w-4 text-slate-400" />{trvSaved ? "Saved ✓" : "Save"}
                  </button>
                  <button onClick={handleCompleteTravelPrep} className="inline-flex items-center gap-2 rounded-md bg-slate-800 px-5 py-2 text-sm font-medium text-white hover:bg-slate-900">
                    <Send className="h-4 w-4" /> Mark Travel Prep Complete
                  </button>
                </div>
              )}
              {trv?.isComplete && (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Travel preparation complete — workflow advanced to Advance Payment.
                </div>
              )}
            </div>
          )}

          {/* ── PAYMENT ── */}
          {tab === "payment" && (
            <div className="space-y-5">
              {/* Advance Payment */}
              <Card title="Advance Payment (Non-Refundable)" icon={DollarSign} color="blue">
                <p className="mb-3 text-xs text-slate-500 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                  {paymentModes.advance.note}
                </p>
                {!pay?.advancePaid ? (
                  <div className="space-y-3">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Amount (USD) — optional, TBF if blank</label>
                        <input type="number" value={advAmt} onChange={(e) => setAdvAmt(e.target.value)} placeholder="To be finalized…" className={inputCls} />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Payment Reference</label>
                        <input value={advRef} onChange={(e) => setAdvRef(e.target.value)} placeholder="Transaction ID…" className={inputCls} />
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Payment Mode</label>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {paymentModes.modes.map((m) => (
                          <ModeButton key={m.id} mode={m} selected={advMode === m.id} onSelect={() => setAdvMode(m.id as PaymentMode)} />
                        ))}
                      </div>
                    </div>
                    <button onClick={handleAdvancePayment} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700">
                      <DollarSign className="h-4 w-4" /> Confirm Advance Payment Received
                    </button>
                  </div>
                ) : (
                  <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex items-center gap-2 mb-2"><CheckCircle2 className="h-5 w-5 text-emerald-600" /><p className="font-semibold text-emerald-800">Advance Payment Confirmed</p></div>
                    <div className="grid gap-2 sm:grid-cols-3 text-xs text-slate-600">
                      <span><span className="font-medium text-slate-400 uppercase text-[10px]">Amount:</span> {pay.advanceAmountUSD ? `$${pay.advanceAmountUSD}` : "TBF"}</span>
                      <span><span className="font-medium text-slate-400 uppercase text-[10px]">Mode:</span> {pay.advanceMode?.replace(/_/g, " ")}</span>
                      <span><span className="font-medium text-slate-400 uppercase text-[10px]">Ref:</span> {pay.advanceReference || "—"}</span>
                    </div>
                  </div>
                )}
              </Card>

              {/* Final Payment */}
              <Card title="Final Payment (Due on Arrival)" icon={CreditCard}>
                <p className="mb-3 text-xs text-slate-500">{paymentModes.finalPayment.note}</p>
                {/* Mode declaration in advance */}
                {!pay?.finalPaid && (
                  <div className="mb-4">
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Declare Payment Mode in Advance</label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {paymentModes.modes.map((m) => (
                        <ModeButton key={m.id} mode={m} selected={finMode === m.id} onSelect={() => setFinMode(m.id as PaymentMode)} />
                      ))}
                    </div>
                    <button onClick={handleDeclareMode} className="mt-3 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                      <Save className="h-3 w-3" />{paySaved ? "Mode Saved ✓" : "Save Declared Mode"}
                    </button>
                  </div>
                )}
                {!pay?.finalPaid ? (
                  <div className="space-y-3">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Amount (USD)</label>
                        <input type="number" value={finAmt} onChange={(e) => setFinAmt(e.target.value)} placeholder="Remaining balance…" className={inputCls} />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Payment Reference</label>
                        <input value={finRef} onChange={(e) => setFinRef(e.target.value)} placeholder="Transaction ID…" className={inputCls} />
                      </div>
                    </div>
                    <button onClick={handleFinalPayment} className="inline-flex items-center gap-2 rounded-md bg-slate-800 px-5 py-2 text-sm font-medium text-white hover:bg-slate-900">
                      <DollarSign className="h-4 w-4" /> Confirm Final Payment Received
                    </button>
                  </div>
                ) : (
                  <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex items-center gap-2 mb-2"><CheckCircle2 className="h-5 w-5 text-emerald-600" /><p className="font-semibold text-emerald-800">Final Payment Confirmed</p></div>
                    <div className="grid gap-2 sm:grid-cols-3 text-xs text-slate-600">
                      <span><span className="font-medium text-slate-400 uppercase text-[10px]">Amount:</span> {pay.finalAmountUSD ? `$${pay.finalAmountUSD}` : "—"}</span>
                      <span><span className="font-medium text-slate-400 uppercase text-[10px]">Mode:</span> {pay.finalMode?.replace(/_/g, " ")}</span>
                      <span><span className="font-medium text-slate-400 uppercase text-[10px]">Ref:</span> {pay.finalReference || "—"}</span>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* ── ADMISSION ── */}
          {tab === "admission" && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Receiving ACO Name</label>
                  <input value={acoName} onChange={(e) => setAcoName(e.target.value)} disabled={adm?.isAdmitted} placeholder="ACO name…" className={inputCls} />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Actual Arrival Date</label>
                  <input type="date" value={acoArrDate} onChange={(e) => setAcoArrDate(e.target.value)} disabled={adm?.isAdmitted} className={inputCls} />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">ACO Admission Checklist</p>
                {admissionData.items.map((item) => {
                  const status = (adm?.admissionChecklist || []).find((a) => a.itemId === item.id);
                  return (
                    <CheckRow key={item.id} label={item.label} description={item.description}
                      checked={status?.done ?? false} timestamp={status?.doneAt}
                      onToggle={() => adm && !adm.isAdmitted && toggleAdmissionItem(adm.id, item.id)}
                      disabled={adm?.isAdmitted} />
                  );
                })}
              </div>

              {!adm?.isAdmitted ? (
                <div className="flex items-center gap-3 pt-2">
                  <button onClick={handleSaveAdmission} className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                    <Save className="h-4 w-4 text-slate-400" />{admSaved ? "Saved ✓" : "Save"}
                  </button>
                  <button onClick={handleAdmit} className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-800">
                    <LogIn className="h-4 w-4" /> Admit to Panchakarma Program
                  </button>
                </div>
              ) : (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Patient admitted on {formatDate(adm.admittedAt!)} — workflow advanced to Active Treatment.
                </div>
              )}
            </div>
          )}

          {/* ── DOCUMENTS ── */}
          {tab === "documents" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-slate-500">
                  {isIntl ? "International patient — all 7 documents required" : "Domestic patient — 4 documents required"}
                </p>
                <p className="text-xs font-semibold text-slate-700">{docSubmitted}/{docTotal} submitted</p>
              </div>

              {applicableReqDocs.map((doc) => {
                const docStatus = (docs?.documents || []).find((d) => d.docId === doc.id);
                const st = docStatusConfig[docStatus?.status ?? "not_submitted"];
                return (
                  <div key={doc.id} className={cn(
                    "flex items-center justify-between gap-3 rounded-md border px-4 py-3",
                    docStatus?.status === "verified"  ? "border-emerald-200 bg-emerald-50" :
                    docStatus?.status === "submitted" ? "border-blue-200 bg-blue-50" :
                    docStatus?.status === "rejected"  ? "border-rose-200 bg-rose-50" :
                    "border-slate-200 bg-white"
                  )}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-800">{doc.label}</p>
                        {doc.requiredForInternational && !doc.requiredForDomestic && (
                          <span className="inline-flex items-center gap-1 rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                            <Globe className="h-2.5 w-2.5" /> Intl. only
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{doc.description}</p>
                      {docStatus?.submittedAt && <p className="text-[10px] text-slate-400 mt-0.5">Submitted {formatDate(docStatus.submittedAt)}</p>}
                      {docStatus?.verifiedAt  && <p className="text-[10px] text-emerald-600 mt-0.5">Verified {formatDate(docStatus.verifiedAt)}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={cn("inline-flex rounded border px-2 py-0.5 text-[11px] font-medium", st.cls)}>{st.label}</span>
                      <button onClick={() => cycleDocStatus(doc.id)} className="text-[10px] text-slate-400 hover:text-slate-700 underline">
                        Update →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
