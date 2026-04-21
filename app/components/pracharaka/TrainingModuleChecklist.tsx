"use client";

import { useAppStore } from "@/lib/store/useAppStore";
import trainingModulesData from "@/data/pracharaka-training-modules.json";
import { formatDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import { CheckSquare, Square, Clock, BookOpen, Video, Monitor, FileText, Award } from "lucide-react";

const MODULE_TYPE_CONFIG = {
  live_session: { label: "Live Session",      icon: Monitor,   className: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  recorded:     { label: "Recorded Module",   icon: Video,     className: "bg-blue-50   text-blue-700   border-blue-200"   },
  material:     { label: "Learning Material", icon: FileText,  className: "bg-slate-50  text-slate-600  border-slate-200"  },
  course:       { label: "Course",            icon: BookOpen,  className: "bg-purple-50 text-purple-700 border-purple-200" },
} as const;

interface TrainingModuleChecklistProps {
  pracharakaId: string;
  /** "training_components" | "learning_materials" */
  groupId?: string;
  /** If true the list is read-only (no toggling) */
  readOnly?: boolean;
}

export function TrainingModuleChecklist({
  pracharakaId,
  groupId,
  readOnly = false,
}: TrainingModuleChecklistProps) {
  const { pracharakaTrainingById, toggleTrainingModule } = useAppStore();
  const record = pracharakaTrainingById(pracharakaId);

  const groups = groupId
    ? trainingModulesData.groups.filter((g) => g.id === groupId)
    : trainingModulesData.groups;

  return (
    <div className="space-y-6">
      {groups.map((group) => {
        const groupCompleted = group.modules.filter(
          (m) => record?.moduleCompletions[m.id]
        ).length;

        return (
          <div key={group.id}>
            {/* Group header */}
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {group.label}
                </h3>
                <p className="mt-0.5 text-[10px] text-slate-400">{group.description}</p>
              </div>
              <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                {groupCompleted} / {group.modules.length}
              </span>
            </div>

            {/* Module rows */}
            <div className="divide-y divide-slate-50 rounded-lg border border-slate-200 bg-white overflow-hidden">
              {group.modules.map((module) => {
                const isCompleted = record?.moduleCompletions[module.id] ?? false;
                const completedDate = record?.moduleCompletionDates[module.id];
                const typeKey = module.type as keyof typeof MODULE_TYPE_CONFIG;
                const typeCfg = MODULE_TYPE_CONFIG[typeKey] ?? MODULE_TYPE_CONFIG.recorded;
                const TypeIcon = typeCfg.icon;

                return (
                  <div
                    key={module.id}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 transition-colors",
                      isCompleted ? "bg-emerald-50/30" : "hover:bg-slate-50/60",
                      !readOnly && "cursor-pointer select-none"
                    )}
                    onClick={() => {
                      if (!readOnly) {
                        toggleTrainingModule(pracharakaId, module.id, !isCompleted);
                      }
                    }}
                  >
                    {/* Checkbox icon */}
                    <div className="mt-0.5 shrink-0">
                      {isCompleted ? (
                        <CheckSquare className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Square className="h-4 w-4 text-slate-300" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={cn(
                            "text-sm font-medium",
                            isCompleted ? "text-slate-500 line-through decoration-slate-300" : "text-slate-800"
                          )}
                        >
                          {module.label}
                        </span>
                        {module.required && (
                          <span className="inline-flex items-center rounded bg-red-50 border border-red-200 px-1 py-0 text-[9px] font-semibold text-red-600 uppercase tracking-wide">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500 leading-snug">
                        {module.description}
                      </p>

                      {/* Meta row */}
                      <div className="mt-1.5 flex items-center gap-3 flex-wrap">
                        {/* Type badge */}
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded border px-1.5 py-0 text-[10px] font-medium",
                            typeCfg.className
                          )}
                        >
                          <TypeIcon className="h-2.5 w-2.5" />
                          {typeCfg.label}
                        </span>

                        {/* Duration */}
                        {"estimatedHours" in module && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                            <Clock className="h-2.5 w-2.5" />
                            {(module as { estimatedHours: number }).estimatedHours}h
                          </span>
                        )}

                        {/* Format */}
                        {"format" in module && (
                          <span className="text-[10px] text-slate-400">
                            {(module as { format: string }).format}
                          </span>
                        )}

                        {/* Completion date */}
                        {isCompleted && completedDate && (
                          <span className="text-[10px] text-emerald-600">
                            Completed {formatDate(completedDate)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right — completion indicator */}
                    {isCompleted && (
                      <div className="shrink-0 mt-0.5">
                        <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0 text-[10px] font-medium text-emerald-700">
                          <Award className="h-2.5 w-2.5" />
                          Done
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
