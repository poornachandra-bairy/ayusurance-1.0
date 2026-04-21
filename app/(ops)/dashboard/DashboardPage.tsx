"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store/useAppStore";
import { useRole } from "@/lib/context/RoleContext";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { cn } from "@/lib/utils/cn";
import {
  ClipboardList, Star, Stethoscope, FileText, MessageSquare,
  CalendarCheck, CreditCard, LogIn, ShieldCheck, Users,
  Activity, ArrowRight, CheckCircle2, Clock, AlertCircle, Syringe,
} from "lucide-react";

function StatCard({ label, value, icon: Icon, color, href }: {
  label: string; value: number | string; icon: React.ElementType;
  color: string; href?: string;
}) {
  const inner = (
    <div className={cn("rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition-shadow", href && "cursor-pointer")}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <div className={cn("rounded-lg p-2", color)}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {href && (
        <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600">
          View all <ArrowRight className="h-3 w-3" />
        </p>
      )}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : <>{inner}</>;
}

function PhaseCard({ stage, count, label, color, href }: {
  stage: number; count: number; label: string; color: string; href: string;
}) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 hover:bg-slate-50 transition-colors shadow-sm">
      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white", color)}>
        {stage}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-800 truncate">{label}</p>
        <p className="text-[11px] text-slate-400">{count} active</p>
      </div>
      <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
    </Link>
  );
}

export function DashboardPage() {
  const {
    patients, pracharakas,
    wishListV2Entries, astroEligibilityV2Entries, screeningV2Records,
    treatmentPlanV2Records, pkConsultationV2Records,
    reservationV2Records, portalOnboardingV2Records,
    travelPrepRecords, arrivalAdmissionRecords,
    qualityChecklists, feedbackRecords,
  } = useAppStore();
  const { role, config } = useRole();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Counts
  const pendingWL     = wishListV2Entries.filter((w) => w.status === "submitted" || w.status === "verified").length;
  const pendingAstro  = astroEligibilityV2Entries.filter((a) => a.status !== "evaluation_completed").length;
  const pendingScr    = screeningV2Records.filter((s) => s.decision === "pending").length;
  const pendingTx     = treatmentPlanV2Records.filter((t) => t.status !== "approved").length;
  const pendingPK     = pkConsultationV2Records.filter((c) => c.status !== "completed").length;
  const pendingRes    = reservationV2Records.filter((r) => !r.feePaid).length;
  const pendingPortal = portalOnboardingV2Records.filter((p) => p.status !== "completed").length;
  const pendingTravel = travelPrepRecords.filter((t) => !t.isComplete).length;
  const admitted      = arrivalAdmissionRecords.filter((a) => a.isAdmitted).length;
  const pendingQC     = qualityChecklists.filter((q) => q.status !== "completed").length;

  // Role-specific views
  if (role === "pracharaka") {
    return <PracharakaDashboard
      totalReferrals={wishListV2Entries.length}
      inScreening={pendingScr}
      admitted={admitted}
    />;
  }
  if (role === "astrologer") {
    return <AstrologerDashboard pending={pendingAstro} completed={astroEligibilityV2Entries.filter((a) => a.status === "evaluation_completed").length} />;
  }
  if (role === "screening_vaidya") {
    return <ScreeningVaidyaDashboard pending={pendingScr} completed={screeningV2Records.filter((s) => s.decision !== "pending").length} />;
  }
  if (role === "treating_vaidya") {
    return <TreatingVaidyaDashboard pendingPlans={pendingTx} pendingConsult={pendingPK} admitted={admitted} />;
  }
  if (role === "aco") {
    return <ACODashboard admitted={admitted} pendingTravel={pendingTravel} pendingQC={pendingQC} />;
  }

  // Admin / Ayusurance Coordinator — full pipeline view
  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations Dashboard"
        subtitle="Full pipeline view — all patient workflow stages at a glance"
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Patients"    value={patients.length}    icon={Users}      color="bg-slate-700"   href="/patients" />
        <StatCard label="Pracharakas"       value={pracharakas.length} icon={Users}      color="bg-amber-600"  href="/pracharaka" />
        <StatCard label="Admitted"          value={admitted}            icon={LogIn}      color="bg-emerald-600" />
        <StatCard label="QC Pending"        value={pendingQC}           icon={ShieldCheck} color="bg-rose-600"  href="/quality-control" />
      </div>

      {/* Pipeline */}
      <div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">Workflow Pipeline — Pending Items</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <PhaseCard stage={2} count={pendingWL}     label="Wish List"        color="bg-amber-500"   href="/wishlist" />
          <PhaseCard stage={3} count={pendingAstro}  label="Astro Eligibility" color="bg-violet-600" href="/astro" />
          <PhaseCard stage={4} count={pendingScr}    label="Screening"        color="bg-teal-600"    href="/screening" />
          <PhaseCard stage={5} count={pendingTx}     label="Treatment Plan"   color="bg-indigo-600"  href="/treatment-plan" />
          <PhaseCard stage={6} count={pendingPK}     label="PK Consultation"  color="bg-violet-600"  href="/pk-consultation" />
          <PhaseCard stage={7} count={pendingRes}    label="Reservation"      color="bg-slate-600"   href="/reservation" />
          <PhaseCard stage={8} count={pendingPortal} label="Portal Onboarding" color="bg-emerald-600" href="/patient-portal" />
          <PhaseCard stage={9} count={pendingTravel} label="Travel & Payment" color="bg-blue-600"    href="/travel-payment" />
          <PhaseCard stage={11} count={admitted}     label="Active Treatment" color="bg-rose-600"    href="/active-treatment" />
        </div>
      </div>

      {/* Recent patients */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Recent Patients</p>
          <Link href="/patients" className="text-[11px] text-emerald-600 hover:underline flex items-center gap-1">View all <ArrowRight className="h-3 w-3" /></Link>
        </div>
        <div className="space-y-2">
          {patients.slice(0, 6).map((p) => {
            const wf = p.currentWorkflowStage;
            return (
              <Link key={p.id} href={`/patients/${p.id}`}
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2.5 hover:bg-slate-50 transition-colors">
                <div className="h-8 w-8 shrink-0 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">
                  {p.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
                  <p className="text-[10px] text-slate-400">{p.id} · {p.city}</p>
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                  {wf?.replace(/_/g, " ")}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Role-specific dashboards ──────────────────────────────────────────────

function PracharakaDashboard({ totalReferrals, inScreening, admitted }: { totalReferrals: number; inScreening: number; admitted: number }) {
  return (
    <div className="space-y-5">
      <PageHeader title="Pracharaka Dashboard" subtitle="Your referrals, patient pipeline, and commission tracking" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="My Referrals"   value={totalReferrals} icon={ClipboardList} color="bg-amber-600"   href="/wishlist" />
        <StatCard label="In Screening"   value={inScreening}    icon={Stethoscope}   color="bg-teal-600"    href="/screening" />
        <StatCard label="Admitted"       value={admitted}        icon={LogIn}         color="bg-emerald-600" />
      </div>
      <QuickLinks links={[
        { href: "/wishlist/new", label: "Create New Wish List",   icon: ClipboardList, color: "bg-amber-50 border-amber-200 text-amber-800" },
        { href: "/wishlist",     label: "View My Referrals",      icon: ClipboardList, color: "bg-slate-50 border-slate-200 text-slate-700" },
        { href: "/screening",    label: "My Patients in Screening", icon: Stethoscope, color: "bg-teal-50 border-teal-200 text-teal-800" },
        { href: "/pracharaka",   label: "My Certification & Training", icon: Users,   color: "bg-violet-50 border-violet-200 text-violet-800" },
      ]} />
    </div>
  );
}

function AstrologerDashboard({ pending, completed }: { pending: number; completed: number }) {
  return (
    <div className="space-y-5">
      <PageHeader title="Astrologer Dashboard" subtitle="Astrochart evaluations and eligibility assessments" />
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Pending Evaluations" value={pending}   icon={Star} color="bg-violet-600" href="/astro" />
        <StatCard label="Completed"           value={completed} icon={CheckCircle2} color="bg-emerald-600" />
      </div>
      <QuickLinks links={[
        { href: "/astro", label: "Open Astro Queue", icon: Star, color: "bg-violet-50 border-violet-200 text-violet-800" },
      ]} />
    </div>
  );
}

function ScreeningVaidyaDashboard({ pending, completed }: { pending: number; completed: number }) {
  return (
    <div className="space-y-5">
      <PageHeader title="Screening Vaidya Dashboard" subtitle="Medical screening consultations and eligibility decisions" />
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Pending Screening"   value={pending}   icon={Stethoscope}   color="bg-teal-600"    href="/screening" />
        <StatCard label="Completed"           value={completed} icon={CheckCircle2}  color="bg-emerald-600" />
      </div>
      <QuickLinks links={[
        { href: "/screening", label: "Open Screening Queue", icon: Stethoscope, color: "bg-teal-50 border-teal-200 text-teal-800" },
        { href: "/patients",  label: "My Patients",          icon: Users,       color: "bg-slate-50 border-slate-200 text-slate-700" },
      ]} />
    </div>
  );
}

function TreatingVaidyaDashboard({ pendingPlans, pendingConsult, admitted }: { pendingPlans: number; pendingConsult: number; admitted: number }) {
  return (
    <div className="space-y-5">
      <PageHeader title="Treating Vaidya Dashboard" subtitle="Treatment plans, PK consultations, and active patients" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Pending Plans"    value={pendingPlans}  icon={FileText}      color="bg-indigo-600"  href="/treatment-plan" />
        <StatCard label="PK Consultations" value={pendingConsult} icon={MessageSquare} color="bg-violet-600"  href="/pk-consultation" />
        <StatCard label="Active Patients"  value={admitted}       icon={Syringe}       color="bg-emerald-600" href="/active-treatment" />
      </div>
      <QuickLinks links={[
        { href: "/treatment-plan",  label: "Treatment Plan Queue",  icon: FileText,      color: "bg-indigo-50 border-indigo-200 text-indigo-800" },
        { href: "/pk-consultation", label: "PK Consultation Queue", icon: MessageSquare, color: "bg-violet-50 border-violet-200 text-violet-800" },
        { href: "/active-treatment", label: "Active Treatment",     icon: Syringe,       color: "bg-rose-50 border-rose-200 text-rose-800" },
      ]} />
    </div>
  );
}

function ACODashboard({ admitted, pendingTravel, pendingQC }: { admitted: number; pendingTravel: number; pendingQC: number }) {
  return (
    <div className="space-y-5">
      <PageHeader title="ACO Dashboard" subtitle="Center operations — arrivals, admission, daily treatment management" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Active Patients"  value={admitted}      icon={Syringe}    color="bg-rose-600"    href="/active-treatment" />
        <StatCard label="Travel Pending"   value={pendingTravel} icon={CreditCard} color="bg-blue-600"    href="/travel-payment" />
        <StatCard label="QC Pending"       value={pendingQC}     icon={ShieldCheck} color="bg-amber-600"  href="/quality-control" />
      </div>
      <QuickLinks links={[
        { href: "/active-treatment", label: "Active Treatment Log",  icon: Syringe,    color: "bg-rose-50 border-rose-200 text-rose-800" },
        { href: "/travel-payment",   label: "Arrivals & Admission",  icon: LogIn,      color: "bg-blue-50 border-blue-200 text-blue-800" },
        { href: "/documents",        label: "Patient Documents",     icon: FileText,   color: "bg-slate-50 border-slate-200 text-slate-700" },
        { href: "/quality-control",  label: "Quality Control",       icon: ShieldCheck, color: "bg-amber-50 border-amber-200 text-amber-800" },
      ]} />
    </div>
  );
}

function QuickLinks({ links }: { links: { href: string; label: string; icon: React.ElementType; color: string }[] }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400">Quick Actions</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {links.map((l) => {
          const Icon = l.icon;
          return (
            <Link key={l.href} href={l.href}
              className={cn("flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium transition-all hover:opacity-80", l.color)}>
              <Icon className="h-4 w-4 shrink-0" />
              {l.label}
              <ArrowRight className="ml-auto h-3.5 w-3.5 opacity-60" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
