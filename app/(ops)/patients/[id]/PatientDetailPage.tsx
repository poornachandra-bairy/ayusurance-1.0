"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import * as Tabs from "@radix-ui/react-tabs";
import { useAppStore } from "@/lib/store/useAppStore";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { WorkflowTracker } from "@/app/components/workflow/WorkflowTracker";
import { ActionLogPanel } from "@/app/components/workflow/ActionLogPanel";
import { StageStatusBadge } from "@/app/components/workflow/StageStatusBadge";
import workflowStagesV2 from "@/data/workflow-stages-v2.json";
import { WORKFLOW_STAGE_IDS } from "@/lib/types/workflow";
import { formatDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import {
  ArrowLeft, User, MapPin, Phone, Mail, Calendar, Flag,
  FileText, AlertTriangle, CheckCircle2, Clock, Activity
} from "lucide-react";

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm text-slate-700">{value ?? "—"}</p>
    </div>
  );
}

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const {
    patientById, pracharakaById, workflowRecordByPatientId,
    actionLogsByPatientId, operationalAlerts
  } = useAppStore();

  const patient = patientById(id);
  const wr = workflowRecordByPatientId(id);
  const pracharaka = patient ? pracharakaById(patient.pracharakaId) : undefined;
  const logs = actionLogsByPatientId(id);
  const patientAlerts = operationalAlerts.filter(a => a.patientId === id && !a.isResolved);

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <User className="mb-3 h-10 w-10 text-slate-300" />
        <p className="text-sm font-medium text-slate-600">Patient not found</p>
        <p className="text-xs text-slate-400">ID: {id}</p>
        <Link href="/patients" className="mt-4 text-xs text-blue-600 hover:underline flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" /> All Patients
        </Link>
      </div>
    );
  }

  const currentStageDef = workflowStagesV2.stages.find(s => s.id === wr?.currentWorkflowStageId);
  const currentStageRecord = wr?.stages[wr.currentWorkflowStageId];
  const completedCount = wr ? WORKFLOW_STAGE_IDS.filter(id => wr.stages[id]?.status === "completed").length : 0;

  // Next actions — from the current stage definition
  const nextActions = currentStageDef?.nextActions ?? [];
  const requiredDocs = currentStageDef?.requiredDocuments ?? [];

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Back nav */}
      <div className="flex items-center justify-between">
        <Link
          href="/patients"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All Patients
        </Link>
        <Link
          href={`/patients/${id}/summary`}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-sm"
        >
          <Activity className="h-3.5 w-3.5" /> Full Summary
        </Link>
      </div>

      {/* Page header with patient identity */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{patient.name}</h1>
          <div className="mt-1 flex items-center gap-3 flex-wrap">
            <span className="text-xs text-slate-500">{patient.id}</span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500">{patient.age}y · {patient.gender}</span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500">{patient.city}, {patient.state}</span>
            {patient.isNRI && (
              <span className="inline-flex rounded bg-blue-100 px-2 py-0 text-[10px] font-medium text-blue-700">NRI</span>
            )}
          </div>
        </div>

        {/* Stage + status summary */}
        {wr && currentStageDef && (
          <div className="flex flex-col items-end gap-1.5">
            <p className="text-[11px] text-slate-400">Current Stage</p>
            <p className="text-sm font-semibold text-slate-800">
              {currentStageDef.order}. {currentStageDef.label}
            </p>
            {currentStageRecord && <StageStatusBadge status={currentStageRecord.status} />}
          </div>
        )}
      </div>

      {/* Alerts bar */}
      {patientAlerts.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-amber-800">{patientAlerts.length} Active Alert{patientAlerts.length > 1 ? "s" : ""}</p>
            {patientAlerts.map(a => (
              <p key={a.id} className="text-xs text-amber-700">{a.message}</p>
            ))}
          </div>
        </div>
      )}

      {/* Quick stats bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Stages Complete", value: `${completedCount} / 12`, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Log Entries", value: logs.length, icon: Activity, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Days Since Created", value: Math.floor((Date.now() - new Date(patient.createdAt).getTime()) / 86400000), icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Open Alerts", value: patientAlerts.length, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
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

      {/* ── Main tabs ─────────────────────────────────────────── */}
      <Tabs.Root defaultValue="workflow" className="space-y-4">
        <Tabs.List className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
          {[
            { value: "workflow",  label: "Workflow Tracker" },
            { value: "log",       label: `Action Log (${logs.length})` },
            { value: "patient",   label: "Patient Info" },
            { value: "nextsteps", label: "Next Actions" },
          ].map(tab => (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                "text-slate-600 hover:text-slate-800",
                "data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
              )}
            >
              {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {/* Workflow Tracker tab */}
        <Tabs.Content value="workflow" className="focus:outline-none">
          <WorkflowTracker patientId={patient.id} />
        </Tabs.Content>

        {/* Action Log tab */}
        <Tabs.Content value="log" className="focus:outline-none">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <ActionLogPanel patientId={patient.id} />
          </div>
        </Tabs.Content>

        {/* Patient Info tab */}
        <Tabs.Content value="patient" className="focus:outline-none">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Demographics */}
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm space-y-3">
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Demographics</p>
              <div className="grid grid-cols-2 gap-3">
                <InfoRow label="Full Name" value={patient.name} />
                <InfoRow label="Patient ID" value={patient.id} />
                <InfoRow label="Age" value={patient.age} />
                <InfoRow label="Gender" value={patient.gender} />
                <InfoRow label="Date of Birth" value={formatDate(patient.dateOfBirth)} />
                <InfoRow label="Nationality" value={patient.nationality} />
                <InfoRow label="NRI Status" value={patient.isNRI ? "Yes" : "No"} />
                <InfoRow label="Language" value={patient.preferredLanguage} />
              </div>
            </div>

            {/* Contact & Location */}
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm space-y-3">
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Contact & Location</p>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  {patient.phone}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  {patient.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  {patient.city}, {patient.state}{patient.country ? `, ${patient.country}` : ""}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <InfoRow label="Created" value={formatDate(patient.createdAt)} />
                <InfoRow label="Pracharaka" value={pracharaka?.name} />
              </div>
            </div>

            {/* Chief Complaint */}
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:col-span-2">
              <p className="mb-2 text-xs font-semibold text-slate-700 uppercase tracking-wide">Chief Complaint</p>
              <p className="text-sm text-slate-700">{patient.chiefComplaint}</p>
            </div>
          </div>
        </Tabs.Content>

        {/* Next Actions tab */}
        <Tabs.Content value="nextsteps" className="focus:outline-none">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Next actions */}
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="mb-3 text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Next Actions — {currentStageDef?.label ?? "Current Stage"}
              </p>
              {nextActions.length === 0 ? (
                <p className="text-xs text-slate-400">No next action data available.</p>
              ) : (
                <ol className="space-y-2">
                  {nextActions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[9px] font-bold text-blue-700">
                        {i + 1}
                      </span>
                      {action}
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {/* Required documents */}
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="mb-3 text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Required Documents — {currentStageDef?.label ?? "Current Stage"}
              </p>
              {requiredDocs.length === 0 ? (
                <p className="text-xs text-slate-400">No documents required for this stage.</p>
              ) : (
                <ul className="space-y-2">
                  {requiredDocs.map((doc, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-slate-700">
                      <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{doc}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* SLA info */}
            {currentStageDef && (
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:col-span-2">
                <p className="mb-1 text-xs font-semibold text-slate-700 uppercase tracking-wide">Stage SLA</p>
                <p className="text-sm text-slate-700">{currentStageDef.sla}</p>
                <p className="mt-1 text-xs text-slate-400">Owner: {currentStageDef.owner}</p>
              </div>
            )}
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
