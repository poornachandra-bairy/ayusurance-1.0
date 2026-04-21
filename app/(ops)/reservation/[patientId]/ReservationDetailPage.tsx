"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAppStore } from "@/lib/store/useAppStore";
import { PageHeader } from "@/app/components/shell/PageHeader";
import type { PaymentMode, WhatsAppGroupMemberStatus } from "@/lib/types/reservationV2";
import feeConfig        from "@/data/reservation-fee-config.json";
import ekitData         from "@/data/ekit-contents.json";
import portalChecklist  from "@/data/portal-onboarding-checklist.json";
import waGroupConfig    from "@/data/whatsapp-group-config.json";
import { formatDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import {
  ArrowLeft, CalendarCheck, DollarSign, CheckCircle2,
  Package, Shield, Smartphone, Users, MessageSquare,
  Globe, Save, Send, User, Info as InfoIcon,
} from "lucide-react";

const inputCls = "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400";

const TAB_IDS = ["reservation", "ekit", "portal", "whatsapp"] as const;
type TabId = typeof TAB_IDS[number];

const TABS: { id: TabId; label: string; Icon: React.ElementType }[] = [
  { id: "reservation", label: "Reservation & Fee",    Icon: DollarSign },
  { id: "ekit",        label: "Orientation e-Kit",    Icon: Package },
  { id: "portal",      label: "Portal Onboarding",    Icon: Smartphone },
  { id: "whatsapp",    label: "WhatsApp Group",       Icon: MessageSquare },
];

function Section({ title, icon: Icon, children, accent = false }: {
  title: string; icon: React.ElementType; children: React.ReactNode; accent?: boolean;
}) {
  return (
    <section className={cn("rounded-lg border bg-white shadow-sm overflow-hidden", accent ? "border-emerald-200" : "border-slate-200")}>
      <div className={cn("flex items-center gap-2 border-b px-5 py-3", accent ? "border-emerald-100 bg-emerald-50/60" : "border-slate-100 bg-slate-50/50")}>
        <Icon className={cn("h-4 w-4", accent ? "text-emerald-600" : "text-slate-400")} />
        <h2 className={cn("text-sm font-semibold", accent ? "text-emerald-800" : "text-slate-800")}>{title}</h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

function CheckRow({ label, description, checked, onToggle, disabled, badge }: {
  label: string; description?: string; checked: boolean; onToggle?: () => void; disabled?: boolean; badge?: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onToggle} disabled={disabled || !onToggle}
      className={cn("flex w-full items-start gap-3 rounded-md border px-4 py-2.5 text-left text-sm transition-all",
        checked ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50",
        disabled && "cursor-default"
      )}>
      <div className={cn("mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center", checked ? "border-emerald-500 bg-emerald-500" : "border-slate-300")}>
        {checked && <CheckCircle2 className="h-3 w-3 text-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn("font-medium text-sm", checked ? "text-emerald-800" : "text-slate-700")}>{label}</p>
          {badge}
        </div>
        {description && <p className="text-[11px] text-slate-400 mt-0.5">{description}</p>}
      </div>
    </button>
  );
}

export function ReservationDetailPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const [activeTab, setActiveTab] = useState<TabId>("reservation");

  const {
    reservationV2ByPatientId, portalOnboardingV2ByPatientId,
    pkConsultationV2ByPatientId,
    patients, pracharakas,
    initiateReservation, updateReservationV2,
    confirmReservationPayment, dispatchEkitItem,
    initiatePortalOnboarding, updatePortalOnboardingV2, completePortalOnboarding,
  } = useAppStore();

  const patient  = patients.find((p) => p.id === patientId);
  const pr       = pracharakas.find((p) => p.id === patient?.pracharakaId);
  const pkConsult = pkConsultationV2ByPatientId(patientId);

  // Auto-initiate reservation if PK consultation is complete
  useEffect(() => {
    if (patient && pkConsult && !reservationV2ByPatientId(patientId)) {
      const isIntl = (patient as any).isInternational ?? false;
      initiateReservation(patientId, pkConsult.id, isIntl);
    }
  }, [patient, pkConsult, patientId]);

  const res = reservationV2ByPatientId(patientId);
  const pob = portalOnboardingV2ByPatientId(patientId);

  // ── Reservation local state ──────────────────────────────────────────────
  const [isInternational, setIsInternational] = useState(res?.isInternationalPatient ?? false);
  const [destCountry,     setDestCountry]     = useState(res?.destinationCountry ?? "India");
  const [paymentMode,     setPaymentMode]     = useState<PaymentMode>(res?.paymentMode ?? "wire_transfer");
  const [paymentRef,      setPaymentRef]      = useState(res?.paymentReference ?? "");
  const [resSaved,        setResSaved]        = useState(false);

  // ── Portal local state ───────────────────────────────────────────────────
  const [portalItems,   setPortalItems]   = useState<Record<string, boolean>>(pob?.portalItems ?? {});
  const [waCreated,     setWaCreated]     = useState(pob?.whatsappGroupCreated ?? false);
  const [waGroupName,   setWaGroupName]   = useState(pob?.whatsappGroupName ?? "");
  const [waMembers,     setWaMembers]     = useState<WhatsAppGroupMemberStatus[]>(
    pob?.whatsappMembers ?? waGroupConfig.members.map((m) => ({ memberId: m.id, added: false }))
  );
  const [portalSaved,   setPortalSaved]   = useState(false);

  useEffect(() => {
    if (res) { setIsInternational(res.isInternationalPatient); setDestCountry(res.destinationCountry ?? "India"); }
  }, [res?.id]);

  useEffect(() => {
    if (pob) { setPortalItems(pob.portalItems ?? {}); setWaCreated(pob.whatsappGroupCreated); setWaGroupName(pob.whatsappGroupName ?? ""); setWaMembers(pob.whatsappMembers ?? waGroupConfig.members.map((m) => ({ memberId: m.id, added: false }))); }
  }, [pob?.id]);

  // Auto-initiate portal onboarding after payment confirmed
  useEffect(() => {
    if (res?.feePaid && !pob) initiatePortalOnboarding(patientId, res.id);
  }, [res?.feePaid]);

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <CalendarCheck className="mb-3 h-10 w-10 text-slate-300" />
        <p className="text-sm text-slate-600">Patient not found: {patientId}</p>
        <Link href="/reservation" className="mt-4 text-xs text-emerald-600 hover:underline flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" /> Back
        </Link>
      </div>
    );
  }

  const feePaid = res?.feePaid ?? false;
  const portalComplete = pob?.status === "completed";

  // e-Kit items filtered by international status
  const applicableEkitItems = ekitData.items.filter(
    (item) => !item.internationalOnly || (res?.isInternationalPatient ?? isInternational)
  );
  const ekitDispatchedCount = (res?.ekitItems || []).filter((i) => i.dispatched).length ?? 0;

  function handleSaveReservation() {
    if (!res) return;
    updateReservationV2(res.id, { isInternationalPatient: isInternational, destinationCountry: destCountry });
    setResSaved(true); setTimeout(() => setResSaved(false), 2500);
  }

  function handleConfirmPayment() {
    if (!res || !paymentRef.trim()) { alert("Please enter a payment reference before confirming."); return; }
    confirmReservationPayment(res.id, paymentMode, paymentRef);
  }

  function handleDispatchEkit(itemId: string) {
    if (res) dispatchEkitItem(res.id, itemId);
  }

  function togglePortalItem(id: string) {
    setPortalItems((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleWaMember(idx: number) {
    setWaMembers((prev) => prev.map((m, i) => i === idx ? { ...m, added: !m.added, addedAt: !m.added ? new Date().toISOString() : undefined } : m));
  }

  function handleSavePortal() {
    if (!pob) return;
    updatePortalOnboardingV2(pob.id, { portalItems, whatsappGroupCreated: waCreated, whatsappGroupName: waGroupName, whatsappMembers: waMembers });
    setPortalSaved(true); setTimeout(() => setPortalSaved(false), 2500);
  }

  function handleCompletePortal() {
    handleSavePortal();
    if (pob) completePortalOnboarding(pob.id);
  }

  return (
    <div className="max-w-4xl space-y-5 pb-16">
      <Link href="/reservation" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-3.5 w-3.5" /> Reservation Queue
      </Link>

      <PageHeader
        title={`Reservation & Onboarding — ${patient.name}`}
        subtitle={`$${feeConfig.feeAmountUSD} non-refundable · ${res?.id ?? "Initialising…"}`}
      />

      {/* Status Banner */}
      <div className={cn("flex flex-wrap items-center gap-3 rounded-lg border px-5 py-3",
        portalComplete ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50")}>
        <span className={cn("inline-flex items-center gap-1.5 rounded border px-2.5 py-0.5 text-xs font-medium",
          feePaid ? "border-emerald-200 bg-emerald-100 text-emerald-800" : "border-amber-200 bg-amber-100 text-amber-800")}>
          <DollarSign className="h-3 w-3" /> $300 Fee {feePaid ? "✓ Received" : "Pending"}
        </span>
        <span className={cn("inline-flex items-center gap-1.5 rounded border px-2.5 py-0.5 text-xs font-medium",
          ekitDispatchedCount === applicableEkitItems.length && ekitDispatchedCount > 0
            ? "border-emerald-200 bg-emerald-100 text-emerald-800" : "border-slate-200 bg-white text-slate-600")}>
          <Package className="h-3 w-3" /> e-Kit {ekitDispatchedCount}/{applicableEkitItems.length} dispatched
        </span>
        {portalComplete && <span className="ml-auto text-xs font-semibold text-emerald-700">✓ Onboarding Complete → Travel Preparation</span>}
      </div>

      {/* Tabs */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 overflow-x-auto">
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={cn("flex items-center gap-2 whitespace-nowrap px-5 py-3 text-sm font-medium border-b-2 transition-all",
                activeTab === id
                  ? "border-emerald-500 text-emerald-700 bg-emerald-50/50"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              )}>
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-5">

          {/* ─── TAB 1: Reservation & Fee ─── */}
          {activeTab === "reservation" && (
            <div className="space-y-5">
              {/* Patient type */}
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Patient Type</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    { val: false, label: "Domestic Patient",       sub: "No FORM C required" },
                    { val: true,  label: "International Patient",   sub: "FORM C & Visa guidance included" },
                  ].map(({ val, label, sub }) => (
                    <button key={String(val)} type="button" disabled={feePaid}
                      onClick={() => { setIsInternational(val); }}
                      className={cn("flex items-start gap-3 rounded-md border px-4 py-3 text-left text-sm transition-all",
                        isInternational === val
                          ? "border-emerald-400 bg-emerald-50 ring-1 ring-emerald-400 text-emerald-800"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                        feePaid && "cursor-default"
                      )}>
                      <Globe className={cn("h-4 w-4 mt-0.5 shrink-0", isInternational === val ? "text-emerald-600" : "text-slate-400")} />
                      <div>
                        <p className="font-semibold">{label}</p>
                        <p className="text-[11px] text-slate-400">{sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
                {isInternational && (
                  <div className="mt-3 max-w-xs">
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Destination Country</label>
                    <input value={destCountry} onChange={(e) => setDestCountry(e.target.value)} disabled={feePaid} placeholder="e.g. India" className={inputCls} />
                  </div>
                )}
              </div>

              {/* Fee includes */}
              <div className="rounded-md border border-slate-100 bg-slate-50 p-4">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">Reservation Includes</p>
                <ul className="space-y-1">
                  {feeConfig.includes.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Payment */}
              {!feePaid ? (
                <div className="space-y-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Payment Details</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Payment Mode</label>
                      <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value as PaymentMode)} className={inputCls}>
                        <option value="wire_transfer">Wire Transfer</option>
                        <option value="stripe">Stripe / Card</option>
                        <option value="upi">UPI</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Payment Reference / Transaction ID</label>
                      <input value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} placeholder="Transaction ID or reference number…" className={inputCls} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={handleSaveReservation}
                      className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                      <Save className="h-4 w-4 text-slate-400" />{resSaved ? "Saved ✓" : "Save"}
                    </button>
                    <button onClick={handleConfirmPayment}
                      className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700">
                      <DollarSign className="h-4 w-4" /> Confirm $300 Payment Received
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <p className="font-semibold text-emerald-800">Payment Confirmed</p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3 text-xs text-slate-600">
                    <span><span className="font-medium text-slate-400 uppercase text-[10px]">Amount:</span> ${res?.feeAmountUSD}</span>
                    <span><span className="font-medium text-slate-400 uppercase text-[10px]">Mode:</span> {res?.paymentMode?.replace(/_/g, " ")}</span>
                    <span><span className="font-medium text-slate-400 uppercase text-[10px]">Ref:</span> {res?.paymentReference}</span>
                    {res?.feePaidAt && <span><span className="font-medium text-slate-400 uppercase text-[10px]">Date:</span> {formatDate(res.feePaidAt)}</span>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── TAB 2: Orientation e-Kit ─── */}
          {activeTab === "ekit" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  {isInternational
                    ? "All items applicable — patient is international (incl. FORM C & Visa Guidance)"
                    : "Domestic patient — FORM C and Visa Guidance excluded"}
                </p>
                <span className="text-xs font-semibold text-emerald-700">{ekitDispatchedCount}/{applicableEkitItems.length} dispatched</span>
              </div>

              {applicableEkitItems.map((item) => {
                const ekitStatus = (res?.ekitItems || []).find((i) => i.itemId === item.id);
                const dispatched = ekitStatus?.dispatched ?? false;
                return (
                  <div key={item.id} className={cn(
                    "flex items-start justify-between gap-3 rounded-md border px-4 py-3",
                    dispatched ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"
                  )}>
                    <div className="flex items-start gap-3 flex-1">
                      <div className={cn("mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center",
                        dispatched ? "border-emerald-500 bg-emerald-500" : "border-slate-300")}>
                        {dispatched && <CheckCircle2 className="h-3 w-3 text-white" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={cn("text-sm font-medium", dispatched ? "text-emerald-800" : "text-slate-700")}>{item.label}</p>
                          {item.internationalOnly && (
                            <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                              <Globe className="h-2.5 w-2.5" /> International
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{item.description}</p>
                        {dispatched && ekitStatus?.dispatchedAt && (
                          <p className="text-[10px] text-emerald-600 mt-0.5">Dispatched {formatDate(ekitStatus.dispatchedAt)}</p>
                        )}
                      </div>
                    </div>
                    {!dispatched && res && (
                      <button onClick={() => handleDispatchEkit(item.id)}
                        className="shrink-0 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50">
                        Mark Dispatched
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ─── TAB 3: Portal Onboarding ─── */}
          {activeTab === "portal" && (
            <div className="space-y-4">
              {!feePaid ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                  <InfoIcon className="inline h-4 w-4 mr-1.5" />
                  Portal onboarding is available after the reservation fee is confirmed.
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-2">Portal Access Checklist</p>
                    {portalChecklist.items.map((item) => (
                      <CheckRow
                        key={item.id}
                        label={item.label}
                        description={item.description}
                        checked={(portalItems || {})[item.id] ?? false}
                        onToggle={() => !portalComplete && togglePortalItem(item.id)}
                        disabled={portalComplete}
                      />
                    ))}
                  </div>

                  {!portalComplete && pob && (
                    <div className="flex items-center gap-3 pt-2">
                      <button onClick={handleSavePortal}
                        className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                        <Save className="h-4 w-4 text-slate-400" />{portalSaved ? "Saved ✓" : "Save Progress"}
                      </button>
                      <button onClick={handleCompletePortal}
                        className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700">
                        <Send className="h-4 w-4" /> Mark Onboarding Complete
                      </button>
                    </div>
                  )}
                  {portalComplete && (
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 font-medium flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" /> Portal onboarding complete — workflow advanced to Travel Preparation.
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ─── TAB 4: WhatsApp Group ─── */}
          {activeTab === "whatsapp" && (
            <div className="space-y-5">
              {!feePaid ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                  <InfoIcon className="inline h-4 w-4 mr-1.5" />
                  WhatsApp group setup is available after the reservation fee is confirmed.
                </div>
              ) : (
                <>
                  {/* Group creation */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Group Name</label>
                      <input value={waGroupName} onChange={(e) => setWaGroupName(e.target.value)} disabled={portalComplete}
                        placeholder="e.g. PK Batch — Arjun Verma" className={inputCls} />
                    </div>
                    <div className="flex items-end">
                      <CheckRow label="WhatsApp Group Created" checked={waCreated}
                        onToggle={() => !portalComplete && setWaCreated((v) => !v)} disabled={portalComplete} />
                    </div>
                  </div>

                  {/* Members */}
                  <div>
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Member Status</p>
                    <div className="space-y-2">
                      {waGroupConfig.members.map((member, idx) => {
                        const mStatus = waMembers.find((m) => m.memberId === member.id);
                        const added = mStatus?.added ?? false;
                        return (
                          <div key={member.id} className={cn(
                            "flex items-center justify-between rounded-md border px-4 py-2.5",
                            added ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"
                          )}>
                            <div className="flex items-center gap-3">
                              <div className={cn("h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center",
                                added ? "border-emerald-500 bg-emerald-500" : "border-slate-300")}>
                                {added && <CheckCircle2 className="h-3 w-3 text-white" />}
                              </div>
                              <div>
                                <p className={cn("text-sm font-medium", added ? "text-emerald-800" : "text-slate-700")}>{member.label}</p>
                                {added && mStatus?.addedAt && <p className="text-[10px] text-emerald-600">Added {formatDate(mStatus.addedAt)}</p>}
                              </div>
                              {member.mandatory && <span className="ml-2 text-[10px] text-red-400">*</span>}
                            </div>
                            {!portalComplete && (
                              <button onClick={() => toggleWaMember(idx)}
                                className={cn("rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors",
                                  added ? "border-rose-100 bg-white text-rose-500 hover:bg-rose-50" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")}>
                                {added ? "Remove" : "Add"}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Group purposes */}
                  <div className="rounded-md border border-slate-100 bg-slate-50 p-4">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">Group Use Cases</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {waGroupConfig.groupPurposes.map((gp) => (
                        <div key={gp.id} className="flex items-start gap-2 text-xs text-slate-700">
                          <MessageSquare className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-medium">{gp.label}</span>
                            <p className="text-slate-400">{gp.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {!portalComplete && pob && (
                    <div className="flex gap-3">
                      <button onClick={handleSavePortal}
                        className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                        <Save className="h-4 w-4 text-slate-400" />{portalSaved ? "Saved ✓" : "Save"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
