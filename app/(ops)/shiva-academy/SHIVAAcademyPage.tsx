"use client";

import { useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store/useAppStore";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { cn } from "@/lib/utils/cn";
import {
  BookOpen, Video, CheckCircle2, Clock, Users,
  ArrowRight, Play, FileText, Award,
} from "lucide-react";

const SHIVA_MODULES = [
  {
    id: "general_ayurveda",
    title: "General Ayurveda Awareness",
    type: "video",
    icon: Video,
    color: "bg-violet-100 text-violet-700",
    description: "Foundational Ayurveda principles, doshas, and lifestyle guidelines",
    audience: ["pracharaka", "patient"],
    duration: "4 hours",
    format: "Recorded video series",
  },
  {
    id: "pk_eligibility",
    title: "Panchakarma Eligibility Awareness",
    type: "training",
    icon: Award,
    color: "bg-amber-100 text-amber-700",
    description: "Who qualifies for PK, contraindications and ideal candidates",
    audience: ["pracharaka"],
    duration: "2 hours",
    format: "Recorded modules + quiz",
  },
  {
    id: "communication_training",
    title: "Patient Communication Training",
    type: "training",
    icon: Users,
    color: "bg-teal-100 text-teal-700",
    description: "Referral ethics, communication formats, patient onboarding support",
    audience: ["pracharaka"],
    duration: "3 hours",
    format: "Live sessions + recorded",
  },
  {
    id: "pk_orientation_patient",
    title: "PK Orientation — Patient",
    type: "video",
    icon: Play,
    color: "bg-emerald-100 text-emerald-700",
    description: "Orientation videos for patients entering Panchakarma — what to expect, preparation, daily schedule",
    audience: ["patient"],
    duration: "1.5 hours",
    format: "Video modules",
  },
  {
    id: "screening_vaidya_training",
    title: "Screening Vaidya Training",
    type: "training",
    icon: BookOpen,
    color: "bg-indigo-100 text-indigo-700",
    description: "Case studies, protocol training, consultation framework for Screening Vaidyas",
    audience: ["screening_vaidya"],
    duration: "8 hours",
    format: "Live + recorded + case studies",
  },
  {
    id: "referral_checklists",
    title: "Referral Checklists & Templates",
    type: "document",
    icon: FileText,
    color: "bg-slate-100 text-slate-700",
    description: "Standard referral formats, templates and patient communication scripts",
    audience: ["pracharaka"],
    duration: "Self-paced",
    format: "PDF documents",
  },
];

const AUDIENCE_LABELS: Record<string, string> = {
  pracharaka: "Pracharaka",
  patient: "Patient",
  screening_vaidya: "Screening Vaidya",
};

export function SHIVAAcademyPage() {
  const { patients, pracharakas, screeningV2Records, pkConsultationV2Records } = useAppStore();
  const [filterAudience, setFilterAudience] = useState<string>("all");

  const filtered = SHIVA_MODULES.filter((m) =>
    filterAudience === "all" || m.audience.includes(filterAudience)
  );

  // Orientation tracking: how many patients have had PK orientation videos sent
  const orientationSent  = pkConsultationV2Records.filter((c) => c.orientationVideosSent).length;
  const orientationDone  = pkConsultationV2Records.filter((c) => c.orientationVideosDone).length;
  const pracharakaTrained = pracharakas.filter((p) => p.status === "active").length;

  return (
    <div className="space-y-6">
      <PageHeader title="SHIVA Academy" subtitle="Educational material, training modules, and orientation resources" />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Modules",           value: SHIVA_MODULES.length,   icon: BookOpen,      color: "bg-violet-100 text-violet-700" },
          { label: "Certified Pracharakas",   value: pracharakaTrained,      icon: Award,         color: "bg-amber-100 text-amber-700" },
          { label: "Orientation Videos Sent", value: orientationSent,        icon: Play,          color: "bg-emerald-100 text-emerald-700" },
          { label: "Patient Org. Completed",  value: orientationDone,        icon: CheckCircle2,  color: "bg-teal-100 text-teal-700" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className={cn("mb-2 inline-flex rounded-lg p-2", s.color)}>
              <s.icon className="h-4 w-4" />
            </div>
            <p className="text-xl font-bold text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Audience filter */}
      <div className="flex flex-wrap gap-2">
        {["all", "pracharaka", "patient", "screening_vaidya"].map((a) => (
          <button key={a} onClick={() => setFilterAudience(a)}
            className={cn("rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              filterAudience === a
                ? "border-violet-400 bg-violet-100 text-violet-800"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")}>
            {a === "all" ? "All Audiences" : AUDIENCE_LABELS[a] ?? a}
          </button>
        ))}
      </div>

      {/* Modules grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((module) => {
          const Icon = module.icon;
          return (
            <div key={module.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3 mb-3">
                <div className={cn("rounded-lg p-2 shrink-0", module.color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{module.title}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {module.audience.map((a) => (
                      <span key={a} className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase text-slate-500">
                        {AUDIENCE_LABELS[a] ?? a}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-3">{module.description}</p>
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{module.duration}</span>
                <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{module.format}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Orientation tracking table */}
      <div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">Patient Orientation Tracking</p>
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase text-slate-400">Patient</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase text-slate-400">Videos Sent</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase text-slate-400">Completed</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase text-slate-400">Action</th>
              </tr>
            </thead>
            <tbody>
              {pkConsultationV2Records.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-xs text-slate-400 italic">No PK consultations yet.</td></tr>
              )}
              {pkConsultationV2Records.map((c) => {
                const patient = patients.find((p) => p.id === c.patientId);
                return (
                  <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-slate-800">{patient?.name ?? c.patientId}</p>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                        c.orientationVideosSent ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-400")}>
                        {c.orientationVideosSent ? <><CheckCircle2 className="h-2.5 w-2.5" /> Sent</> : <><Clock className="h-2.5 w-2.5" /> Pending</>}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                        c.orientationVideosDone ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-400")}>
                        {c.orientationVideosDone ? <><CheckCircle2 className="h-2.5 w-2.5" /> Done</> : <><Clock className="h-2.5 w-2.5" /> Pending</>}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <Link href={`/pk-consultation/${c.patientId}`} className="text-[11px] text-violet-600 hover:underline flex items-center gap-1">
                        Update <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
