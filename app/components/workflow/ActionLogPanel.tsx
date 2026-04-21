"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useAppStore } from "@/lib/store/useAppStore";
import type { WorkflowStageId, ActionNoteType } from "@/lib/types/workflow";
import { WORKFLOW_STAGE_IDS } from "@/lib/types/workflow";
import workflowStagesV2 from "@/data/workflow-stages-v2.json";
import stakeholderRoles from "@/data/stakeholder-roles.json";
import { formatDateTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import { Plus, MessageSquare, AlertTriangle, FileText, Phone, TrendingUp, Stethoscope, X } from "lucide-react";

const NOTE_TYPE_CONFIG: Record<ActionNoteType, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  update:        { label: "Status Update",   icon: TrendingUp,     color: "text-blue-500" },
  blocker:       { label: "Blocker",         icon: AlertTriangle,  color: "text-amber-500" },
  document:      { label: "Document",        icon: FileText,       color: "text-slate-500" },
  communication: { label: "Communication",   icon: Phone,          color: "text-purple-500" },
  escalation:    { label: "Escalation",      icon: AlertTriangle,  color: "text-red-500" },
  clinical:      { label: "Clinical Note",   icon: Stethoscope,    color: "text-emerald-500" },
};

interface ActionLogPanelProps {
  patientId: string;
}

export function ActionLogPanel({ patientId }: ActionLogPanelProps) {
  const { actionLogsByPatientId, addActionLogEntry } = useAppStore();
  const [open, setOpen] = useState(false);

  // Form state
  const [role, setRole] = useState(stakeholderRoles.roles[0]?.label ?? "Coordinator");
  const [noteType, setNoteType] = useState<ActionNoteType>("update");
  const [stageId, setStageId] = useState<WorkflowStageId | "">("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const logs = actionLogsByPatientId(patientId);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    addActionLogEntry(
      patientId,
      stageId ? (stageId as WorkflowStageId) : undefined,
      role,
      noteType,
      message.trim()
    );
    setMessage("");
    setStageId("");
    setSubmitting(false);
    setOpen(false);
  }

  return (
    <div className="space-y-3">
      {/* Header + Add button */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">Action Log</p>
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild>
            <button className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50">
              <Plus className="h-3.5 w-3.5" />
              Add Note
            </button>
          </Dialog.Trigger>

          {/* Dialog overlay */}
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white p-5 shadow-xl focus:outline-none">
              <div className="mb-4 flex items-center justify-between">
                <Dialog.Title className="text-sm font-semibold text-slate-800">
                  Add Action Log Entry
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                    <X className="h-4 w-4" />
                  </button>
                </Dialog.Close>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Role */}
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-500 uppercase tracking-wide">Role / Stakeholder</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  >
                    {stakeholderRoles.roles.map((r) => (
                      <option key={r.id} value={r.label}>{r.label}</option>
                    ))}
                  </select>
                </div>

                {/* Note type */}
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-500 uppercase tracking-wide">Note Type</label>
                  <select
                    value={noteType}
                    onChange={(e) => setNoteType(e.target.value as ActionNoteType)}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  >
                    {(Object.keys(NOTE_TYPE_CONFIG) as ActionNoteType[]).map((nt) => (
                      <option key={nt} value={nt}>{NOTE_TYPE_CONFIG[nt].label}</option>
                    ))}
                  </select>
                </div>

                {/* Linked stage */}
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-500 uppercase tracking-wide">Linked Stage (optional)</label>
                  <select
                    value={stageId}
                    onChange={(e) => setStageId(e.target.value as WorkflowStageId | "")}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  >
                    <option value="">— Not linked to a specific stage —</option>
                    {workflowStagesV2.stages.map((s) => (
                      <option key={s.id} value={s.id}>{s.order}. {s.label}</option>
                    ))}
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-500 uppercase tracking-wide">Message</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={4}
                    placeholder="Describe the action, observation, or update..."
                    className="w-full resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </Dialog.Close>
                  <button
                    type="submit"
                    disabled={submitting || !message.trim()}
                    className="rounded-md bg-slate-800 px-4 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50"
                  >
                    Save Entry
                  </button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      {/* Log timeline */}
      {logs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white py-8 text-center text-sm text-slate-400">
          <MessageSquare className="mx-auto mb-2 h-5 w-5 text-slate-300" />
          No action log entries yet. Add one using the button above.
        </div>
      ) : (
        <div className="relative space-y-0">
          {/* Timeline line */}
          <div className="absolute left-3.5 top-4 bottom-4 w-px bg-slate-200" />
          <div className="space-y-3">
            {logs.map((log) => {
              const cfg = NOTE_TYPE_CONFIG[log.noteType];
              const Icon = cfg.icon;
              const stageName = workflowStagesV2.stages.find(s => s.id === log.workflowStageId)?.label;
              return (
                <div key={log.id} className="relative flex gap-3">
                  {/* Icon dot */}
                  <div className={cn(
                    "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-white bg-white shadow-sm",
                    log.noteType === "blocker" || log.noteType === "escalation" ? "bg-red-50" : "bg-slate-50"
                  )}>
                    <Icon className={cn("h-3.5 w-3.5", cfg.color)} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="mb-1 flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn(
                          "inline-flex rounded border px-1.5 py-0 text-[10px] font-medium",
                          log.noteType === "blocker" || log.noteType === "escalation"
                            ? "border-red-200 bg-red-50 text-red-700"
                            : "border-slate-200 bg-slate-50 text-slate-600"
                        )}>
                          {cfg.label}
                        </span>
                        <span className="text-[10px] font-medium text-slate-600">{log.role}</span>
                        {stageName && (
                          <span className="text-[10px] text-slate-400">· {stageName}</span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {formatDateTime(log.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{log.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
