"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import * as Tabs from "@radix-ui/react-tabs";
import { useAppStore } from "@/lib/store/useAppStore";
import { CertificationStatusBadge } from "@/app/components/pracharaka/CertificationStatusBadge";
import { OnboardingProgressBar } from "@/app/components/pracharaka/OnboardingProgressBar";
import { TrainingModuleChecklist } from "@/app/components/pracharaka/TrainingModuleChecklist";
import { StageStatusBadge } from "@/app/components/workflow/StageStatusBadge";
import { PRACHARAKA_ELIGIBILITY_CATEGORY_LABELS } from "@/lib/types/pracharaka";
import eligibilityCategoriesData from "@/data/pracharaka-eligibility-categories.json";
import milestonesData from "@/data/pracharaka-onboarding-milestones.json";
import responsibilitiesData from "@/data/pracharaka-responsibilities.json";
import workflowStagesV2 from "@/data/workflow-stages-v2.json";
import { formatDate, nowISO, daysAgo } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import {
  ArrowLeft, User, Phone, Mail, MapPin, Award,
  CheckSquare, Square, Users, AlertTriangle, ChevronRight,
  FileText, Info, CheckCircle2, Clock, BookOpen
} from "lucide-react";

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm text-slate-700">{value ?? "—"}</p>
    </div>
  );
}

export function PracharakaProfilePage() {
  const { id } = useParams<{ id: string }>();
  const {
    pracharakaById,
    pracharakaProfileById,
    pracharakaTrainingById,
    trainingCompletionCount,
    onboardingCompletionCount,
    patientsByPracharaka,
    workflowRecordByPatientId,
    toggleOnboardingMilestone,
    updatePracharakaProfile,
    setAssessmentResult,
  } = useAppStore();

  const pr = pracharakaById(id);
  const profile = pracharakaProfileById(id);
  const training = pracharakaTrainingById(id);
  const trainingCount = trainingCompletionCount(id);
  const onboardingCount = onboardingCompletionCount(id);
  const referredPatients = patientsByPracharaka(id);

  const categoryDef = eligibilityCategoriesData.categories.find(
    (c) => c.id === profile?.eligibilityCategory
  );

  if (!pr || !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <User className="mb-3 h-10 w-10 text-slate-300" />
        <p className="text-sm font-medium text-slate-600">Pracharaka not found</p>
        <p className="text-xs text-slate-400">ID: {id}</p>
        <Link href="/pracharaka" className="mt-4 text-xs text-blue-600 hover:underline flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" /> All Pracharakas
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Back nav */}
      <Link href="/pracharaka" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> All Pracharakas
      </Link>

      {/* Identity header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{pr.name}</h1>
          <div className="mt-1 flex items-center gap-3 flex-wrap">
            <span className="text-xs text-slate-500">{pr.id}</span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500">{pr.city}, {pr.state}{pr.country ? `, ${pr.country}` : ""}</span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500">Joined {formatDate(pr.joinedDate)}</span>
          </div>
          <div className="mt-2">
            <span className="inline-flex rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              {profile.eligibilityCategory ? PRACHARAKA_ELIGIBILITY_CATEGORY_LABELS[profile.eligibilityCategory] : "—"}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <CertificationStatusBadge status={profile.certificationStatus} />
          {!pr.agreementSigned && (
            <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
              <AlertTriangle className="h-2.5 w-2.5" />
              Agreement not signed
            </span>
          )}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Referred Patients", value: referredPatients.length, icon: Users,        color: "text-blue-600",    bg: "bg-blue-50" },
          { label: "Training Complete",  value: `${trainingCount.completed}/${trainingCount.total}`,   icon: BookOpen,     color: "text-indigo-600",  bg: "bg-indigo-50" },
          { label: "Onboarding Steps",  value: `${onboardingCount.completed}/${onboardingCount.total}`, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Days Since Joined", value: Math.floor((Date.now() - new Date(pr.joinedDate).getTime()) / 86400000), icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-medium text-slate-500">{stat.label}</p>
                <div className={`rounded-md p-1 ${stat.bg}`}>
                  <Icon className={`h-3.5 w-3.5 ${stat.color}`} />
                </div>
              </div>
              <p className="mt-1.5 text-lg font-bold text-slate-900">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs.Root defaultValue="profile" className="space-y-4">
        <Tabs.List className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
          {[
            { value: "profile",          label: "Profile" },
            { value: "certification",    label: "Certification" },
            { value: "onboarding",       label: `Onboarding (${onboardingCount.completed}/${onboardingCount.total})` },
            { value: "training",         label: `Training (${trainingCount.completed}/${trainingCount.total})` },
            { value: "materials",        label: "Materials" },
            { value: "commission",       label: "Commission" },
            { value: "patients",         label: `Referred Patients (${referredPatients.length})` },
          ].map(tab => (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                "text-slate-600 hover:text-slate-800",
                "data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
              )}
            >
              {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {/* ── Profile tab ─────────────────────────────────── */}
        <Tabs.Content value="profile" className="focus:outline-none space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Personal info */}
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Personal Information</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" /> {pr.phone}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" /> {pr.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" /> {pr.city}, {pr.state}
                  {pr.country ? `, ${pr.country}` : ""}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                <InfoRow label="Joined" value={formatDate(pr.joinedDate)} />
                <InfoRow label="Total Referrals" value={pr.totalReferrals ?? 0} />
                <InfoRow label="Agreement Signed" value={pr.agreementSigned ? "Yes" : "No"} />
                <InfoRow label="Platform Status" value={pr.status.replace(/_/g, " ")} />
              </div>
            </div>

            {/* Eligibility category detail */}
            {categoryDef && (
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Eligibility Category</p>
                <p className="text-sm font-medium text-slate-800">{categoryDef.label}</p>
                <p className="text-xs text-slate-600 leading-relaxed">{categoryDef.description}</p>
                <div className="border-t border-slate-100 pt-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Referral Rationale</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{categoryDef.rationale}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Examples</p>
                  <ul className="space-y-0.5">
                    {categoryDef.examples.map((ex, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                        <span className="h-1 w-1 rounded-full bg-slate-400 shrink-0" />
                        {ex}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Notes */}
            {profile.notes && (
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:col-span-2">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-600">Coordinator Notes</p>
                <p className="text-sm text-slate-700">{profile.notes}</p>
                <p className="mt-1 text-[10px] text-slate-400">Last updated {daysAgo(profile.updatedAt)}</p>
              </div>
            )}
          </div>
        </Tabs.Content>

        {/* ── Certification tab ────────────────────────────── */}
        <Tabs.Content value="certification" className="focus:outline-none">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Certification Details</p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700">Status:</span>
                <CertificationStatusBadge status={profile.certificationStatus} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InfoRow label="Certification Number" value={profile.certificationNumber} />
                <InfoRow label="Certification Date" value={formatDate(profile.certificationDate)} />
                <InfoRow label="Expiry Date" value={formatDate(profile.certificationExpiryDate)} />
                <InfoRow label="Assessment Passed" value={training?.assessmentPassed ? "Yes" : "No"} />
                <InfoRow label="Assessment Date" value={formatDate(training?.assessmentDate)} />
              </div>
              {training?.assessmentNotes && (
                <div className="border-t border-slate-100 pt-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Assessment Notes</p>
                  <p className="text-xs text-slate-600">{training.assessmentNotes}</p>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Platform & Onboarding</p>
              <div className="grid grid-cols-1 gap-3">
                <InfoRow
                  label="Ayusurance Registration"
                  value={profile.ayusuranceRegistrationStatus === "registered" ? "Registered" : "Not Registered"}
                />
                {profile.ayusuranceRegisteredAt && (
                  <InfoRow label="Registered On" value={formatDate(profile.ayusuranceRegisteredAt)} />
                )}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Communication Group</p>
                    <span className={cn(
                      "mt-1 inline-flex items-center rounded border px-1.5 py-0 text-[10px] font-medium",
                      profile.communicationGroupAdded
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-50 text-slate-500"
                    )}>
                      {profile.communicationGroupAdded ? "Added" : "Pending"}
                    </span>
                    {profile.communicationGroupAddedAt && (
                      <p className="mt-0.5 text-[10px] text-slate-400">{formatDate(profile.communicationGroupAddedAt)}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Referral Formats</p>
                    <span className={cn(
                      "mt-1 inline-flex items-center rounded border px-1.5 py-0 text-[10px] font-medium",
                      profile.referralFormatsProvided
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-50 text-slate-500"
                    )}>
                      {profile.referralFormatsProvided ? "Provided" : "Pending"}
                    </span>
                    {profile.referralFormatsProvidedAt && (
                      <p className="mt-0.5 text-[10px] text-slate-400">{formatDate(profile.referralFormatsProvidedAt)}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Tabs.Content>

        {/* ── Onboarding milestones tab ────────────────────── */}
        <Tabs.Content value="onboarding" className="focus:outline-none">
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-700">Onboarding Milestones</p>
                <p className="text-[11px] text-slate-400">Check off each step as it is completed for this Pracharaka.</p>
              </div>
              <div className="flex items-center gap-2">
                <OnboardingProgressBar
                  completed={onboardingCount.completed}
                  total={onboardingCount.total}
                  size="sm"
                  className="w-28"
                />
              </div>
            </div>
            <div className="divide-y divide-slate-50">
              {milestonesData.milestones.map((milestone) => {
                const done = profile.onboardingMilestones[milestone.id] ?? false;
                return (
                  <div
                    key={milestone.id}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors select-none",
                      done ? "bg-emerald-50/30 hover:bg-emerald-50/50" : "hover:bg-slate-50"
                    )}
                    onClick={() => toggleOnboardingMilestone(id, milestone.id, !done)}
                  >
                    <div className="mt-0.5 shrink-0">
                      {done
                        ? <CheckSquare className="h-4 w-4 text-emerald-600" />
                        : <Square className="h-4 w-4 text-slate-300" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-400">Step {milestone.order}</span>
                        <span className={cn(
                          "text-sm font-medium",
                          done ? "text-slate-500 line-through decoration-slate-300" : "text-slate-800"
                        )}>
                          {milestone.label}
                        </span>
                        <span className={cn(
                          "inline-flex rounded border px-1 py-0 text-[9px] font-semibold uppercase tracking-wide",
                          milestone.requiredFor === "certification"
                            ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                            : milestone.requiredFor === "registration"
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700"
                        )}>
                          {milestone.requiredFor.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500">{milestone.description}</p>
                      <p className="mt-0.5 text-[10px] text-slate-400">Owner: {milestone.owner}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Tabs.Content>

        {/* ── Training Components tab ───────────────────────── */}
        <Tabs.Content value="training" className="focus:outline-none">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700">Training Components</p>
                <p className="text-[11px] text-slate-400">
                  Click any row to mark it complete or incomplete.
                </p>
              </div>
              <OnboardingProgressBar
                completed={trainingCount.completed}
                total={trainingCount.total}
                size="sm"
                className="w-28"
              />
            </div>
            <TrainingModuleChecklist pracharakaId={id} groupId="training_components" />
            {training?.assessmentPassed !== undefined && (
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Assessment</p>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "inline-flex rounded border px-2 py-0.5 text-[11px] font-medium",
                    training.assessmentPassed
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-slate-100 text-slate-500"
                  )}>
                    {training.assessmentPassed ? "Passed" : "Not yet passed"}
                  </span>
                  {training.assessmentDate && (
                    <span className="text-[10px] text-slate-400">{formatDate(training.assessmentDate)}</span>
                  )}
                  {training.assessmentNotes && (
                    <span className="text-[10px] text-slate-500 italic">"{training.assessmentNotes}"</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </Tabs.Content>

        {/* ── Learning Materials tab ────────────────────────── */}
        <Tabs.Content value="materials" className="focus:outline-none">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4">
              <p className="text-sm font-semibold text-slate-700">Learning Materials</p>
              <p className="text-[11px] text-slate-400">
                Mark materials as received and reviewed. Click any row to toggle.
              </p>
            </div>
            <TrainingModuleChecklist pracharakaId={id} groupId="learning_materials" />
          </div>
        </Tabs.Content>

        {/* ── Responsibilities tab ──────────────────────────── */}
        <Tabs.Content value="responsibilities" className="focus:outline-none space-y-3">
          {/* Acknowledgement indicator */}
          <div className={cn(
            "flex items-center justify-between rounded-lg border px-4 py-3",
            profile.responsibilitiesAcknowledged
              ? "border-emerald-200 bg-emerald-50"
              : "border-amber-200 bg-amber-50"
          )}>
            <div className="flex items-center gap-2">
              {profile.responsibilitiesAcknowledged
                ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                : <AlertTriangle className="h-4 w-4 text-amber-600" />
              }
              <p className={cn("text-sm font-medium", profile.responsibilitiesAcknowledged ? "text-emerald-800" : "text-amber-800")}>
                {profile.responsibilitiesAcknowledged
                  ? `Responsibilities acknowledged on ${formatDate(profile.responsibilitiesAcknowledgedAt)}`
                  : "Pracharaka has not yet acknowledged responsibilities"}
              </p>
            </div>
            {!profile.responsibilitiesAcknowledged && (
              <button
                onClick={() =>
                  updatePracharakaProfile(id, {
                    responsibilitiesAcknowledged: true,
                    responsibilitiesAcknowledgedAt: nowISO(),
                  })
                }
                className="shrink-0 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
              >
                Mark as Acknowledged
              </button>
            )}
          </div>

          {/* Responsibility cards */}
          <div className="space-y-3">
            {responsibilitiesData.responsibilities.map((resp, idx) => (
              <div key={resp.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-500">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{resp.label}</p>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">{resp.description}</p>

                    {/* Activities */}
                    <div className="mt-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
                        Specific Activities
                      </p>
                      <ul className="space-y-1">
                        {resp.activities.map((act, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                            {act}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Boundary note */}
                    <div className="mt-3 flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <p className="text-[11px] text-slate-500">{resp.boundary}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Tabs.Content>

        {/* ── Commission tab ───────────────────────────────── */}
        <Tabs.Content value="commission" className="focus:outline-none">
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-800">Commission Tracking</p>
              <p className="text-xs text-slate-500 mb-4">Commissions are earned based on patient progression through the Panchakarma workflow milestones.</p>
              
              <div className="grid gap-3 sm:grid-cols-4 mb-6">
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-center">
                  <p className="text-xs font-medium text-slate-400 uppercase">Referrals</p>
                  <p className="text-xl font-bold text-slate-700">{referredPatients.length}</p>
                </div>
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-center">
                  <p className="text-xs font-medium text-emerald-600 uppercase">Screened</p>
                  <p className="text-xl font-bold text-emerald-700">
                    {referredPatients.filter(p => ["screening_consultation", "treatment_plan", "pk_consultation", "reservation_fee", "patient_portal", "travel_payment", "arrival_admission", "panchakarma_treatment"].includes(workflowRecordByPatientId(p.id)?.currentWorkflowStageId || "")).length}
                  </p>
                </div>
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-center">
                  <p className="text-xs font-medium text-blue-600 uppercase">Admitted</p>
                  <p className="text-xl font-bold text-blue-700">
                    {referredPatients.filter(p => ["panchakarma_treatment"].includes(workflowRecordByPatientId(p.id)?.currentWorkflowStageId || "")).length}
                  </p>
                </div>
                <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-center">
                  <p className="text-xs font-medium text-amber-600 uppercase">Est. Value</p>
                  <p className="text-xl font-bold text-amber-700">TBD</p>
                </div>
              </div>

              {referredPatients.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 py-10 text-center">
                  <Award className="mx-auto mb-2 h-6 w-6 text-slate-300" />
                  <p className="text-sm text-slate-400">No referral commission data available.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left">
                      <th className="pb-2 text-xs font-medium text-slate-500">Patient</th>
                      <th className="pb-2 text-xs font-medium text-slate-500">Wish List Submitted</th>
                      <th className="pb-2 text-xs font-medium text-slate-500">Screening Approved</th>
                      <th className="pb-2 text-xs font-medium text-slate-500">Patient Admitted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {referredPatients.map(patient => {
                      const wr = workflowRecordByPatientId(patient.id);
                      const curStage = wr?.currentWorkflowStageId || "";
                      
                      const screened = ["screening_consultation", "treatment_plan", "pk_consultation", "reservation_fee", "patient_portal", "travel_payment", "arrival_admission", "panchakarma_treatment"].includes(curStage);
                      const admitted = ["panchakarma_treatment"].includes(curStage);
                      
                      return (
                        <tr key={patient.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 pr-4">
                            <p className="font-medium text-slate-800">{patient.name}</p>
                            <p className="text-[10px] text-slate-400">{patient.id}</p>
                          </td>
                          <td className="py-3 px-4">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          </td>
                          <td className="py-3 px-4">
                            {screened ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <div className="h-2 w-2 rounded-full bg-slate-200 mx-1" />}
                          </td>
                          <td className="py-3 px-4">
                            {admitted ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <div className="h-2 w-2 rounded-full bg-slate-200 mx-1" />}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </Tabs.Content>

        {/* ── Referred Patients tab ──────────────────────────── */}
        <Tabs.Content value="patients" className="focus:outline-none">
          {referredPatients.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-white py-16 text-center">
              <Users className="mx-auto mb-2 h-6 w-6 text-slate-300" />
              <p className="text-sm text-slate-400">No patients referred by this Pracharaka yet.</p>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left">
                    <th className="px-4 py-2.5 text-xs font-medium text-slate-500">Patient</th>
                    <th className="px-4 py-2.5 text-xs font-medium text-slate-500">Current Stage</th>
                    <th className="px-4 py-2.5 text-xs font-medium text-slate-500">Stage Status</th>
                    <th className="px-4 py-2.5 text-xs font-medium text-slate-500">Referred</th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {referredPatients.map((patient) => {
                    const wr = workflowRecordByPatientId(patient.id);
                    const stageDef = workflowStagesV2.stages.find(s => s.id === wr?.currentWorkflowStageId);
                    const stageRecord = wr?.stages[wr.currentWorkflowStageId];
                    return (
                      <tr key={patient.id} className="group hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-slate-800">{patient.name}</p>
                          <p className="text-[10px] text-slate-400">{patient.id} · {patient.age}y · {patient.city}</p>
                        </td>
                        <td className="px-4 py-2.5">
                          <p className="text-xs font-medium text-slate-700">{stageDef?.label ?? "—"}</p>
                          <p className="text-[10px] text-slate-400">Stage {stageDef?.order ?? "?"} of 12</p>
                        </td>
                        <td className="px-4 py-2.5">
                          {stageRecord
                            ? <StageStatusBadge status={stageRecord.status} size="sm" />
                            : "—"
                          }
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-400">{daysAgo(patient.createdAt)}</td>
                        <td className="px-4 py-2.5">
                          <Link
                            href={`/patients/${patient.id}`}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-50"
                          >
                            View <ChevronRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
