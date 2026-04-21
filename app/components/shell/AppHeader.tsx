"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, ChevronDown, Check } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { useRole, ROLE_CONFIGS, type AppRole } from "@/lib/context/RoleContext";
import { cn } from "@/lib/utils/cn";

export function AppHeader() {
  const { operationalAlerts, patients } = useAppStore();
  const { role, config, setRole } = useRole();
  const unresolvedAlerts = operationalAlerts.filter((a) => !a.isResolved);
  const highPriorityCount = unresolvedAlerts.filter((a) => a.priority === "high").length;

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
      {/* Left */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-slate-500">Panchakarma Operations</span>
        <span className="h-3.5 w-px bg-slate-200" />
        <span className="text-xs text-slate-400">{patients.length} patient{patients.length !== 1 ? "s" : ""} active</span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Alerts */}
        <button className="relative rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100" aria-label="View alerts">
          <Bell className="h-4 w-4" />
          {highPriorityCount > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />}
        </button>

        <span className="h-5 w-px bg-slate-200" />

        {/* Role Switcher */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-sm transition-all hover:opacity-90",
              config.color, config.textColor, config.borderColor
            )}
          >
            <span className="max-w-[120px] truncate">{config.shortLabel}</span>
            <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
          </button>

          {open && (
            <div className="absolute right-0 top-full z-50 mt-1.5 w-64 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50 px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Switch Role</p>
              </div>
              <div className="py-1 max-h-80 overflow-y-auto">
                {ROLE_CONFIGS.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => { setRole(r.id as AppRole); setOpen(false); }}
                    className={cn(
                      "flex w-full items-start gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-slate-50",
                      role === r.id && "bg-slate-50"
                    )}
                  >
                    <div className={cn("mt-0.5 h-5 w-5 shrink-0 rounded-full flex items-center justify-center text-[9px] font-bold", r.color, r.textColor)}>
                      {r.shortLabel.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-xs">{r.label}</p>
                      <p className="text-[10px] text-slate-400 leading-tight">{r.description}</p>
                    </div>
                    {role === r.id && <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600 mt-0.5" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
