"use client";

import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import { PageHeader } from "@/app/components/shell/PageHeader";
import {
  exportStateAsJson,
  importStateFromJson,
  inspectStorage,
} from "@/lib/storage/adapter";
import { formatDateTime } from "@/lib/utils/date";
import {
  Download, Upload, RotateCcw, Database, CheckCircle2,
  AlertTriangle, Info,
} from "lucide-react";

type FeedbackType = "success" | "error" | "info";

interface Feedback {
  type: FeedbackType;
  message: string;
}

const FEEDBACK_STYLES: Record<FeedbackType, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error:   "border-red-200 bg-red-50 text-red-800",
  info:    "border-blue-200 bg-blue-50 text-blue-700",
};

const FEEDBACK_ICONS: Record<FeedbackType, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle2,
  error:   AlertTriangle,
  info:    Info,
};

export function SettingsPage() {
  const { resetToSeed, dispatch, lastUpdated } = useAppStore();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [storageInspect, setStorageInspect] = useState<ReturnType<typeof inspectStorage> | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function showFeedback(type: FeedbackType, message: string) {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  }

  // ── Export ────────────────────────────────────────────────
  function handleExport() {
    try {
      const json = exportStateAsJson();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pk-ops-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showFeedback("success", "All runtime data exported as JSON successfully.");
    } catch {
      showFeedback("error", "Export failed. Check browser console for details.");
    }
  }

  // ── Import ────────────────────────────────────────────────
  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      const result = importStateFromJson(content);
      if (result.success) {
        // Reload state from localStorage into the store context
        dispatch({ type: "IMPORT_STATE", payload: JSON.parse(content) as Record<string, unknown> as never });
        showFeedback("success", result.error ?? "Data imported successfully. UI will reflect changes after reload.");
      } else {
        showFeedback("error", result.error ?? "Import failed.");
      }
    };
    reader.readAsText(file);
    // Reset so the same file can be re-selected
    e.target.value = "";
  }

  // ── Reset ─────────────────────────────────────────────────
  function handleResetConfirm() {
    resetToSeed();
    setConfirmReset(false);
    showFeedback("success", "All data has been reset to seed defaults.");
  }

  // ── Inspect ───────────────────────────────────────────────
  function handleInspect() {
    setStorageInspect(inspectStorage());
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Settings & Data Manager"
        subtitle="Export, import, inspect and reset all runtime application data stored in this browser."
      />

      {/* Feedback banner */}
      {feedback && (() => {
        const Icon = FEEDBACK_ICONS[feedback.type];
        return (
          <div className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${FEEDBACK_STYLES[feedback.type]}`}>
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{feedback.message}</span>
          </div>
        );
      })()}

      {/* Last updated */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-medium text-slate-500">Storage last written</p>
        <p className="mt-1 text-sm font-semibold text-slate-800">{mounted ? formatDateTime(lastUpdated) : "—"}</p>
        <p className="mt-1 text-xs text-slate-400">Data is stored in this browser&apos;s localStorage and is device-specific.</p>
      </div>

      {/* Actions grid */}
      <div className="grid gap-4 sm:grid-cols-2">

        {/* Export */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <div className="rounded-md bg-emerald-50 p-2">
              <Download className="h-4 w-4 text-emerald-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Export Data</p>
              <p className="text-xs text-slate-500">Download all localStorage as JSON</p>
            </div>
          </div>
          <p className="mb-4 text-xs text-slate-500">
            Exports a complete snapshot of all runtime data across every domain
            (patients, pracharakas, screening, documents, etc.) as a single JSON file.
          </p>
          <button
            onClick={handleExport}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-800"
          >
            <Download className="h-4 w-4" />
            Export All Data
          </button>
        </div>

        {/* Import */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <div className="rounded-md bg-blue-50 p-2">
              <Upload className="h-4 w-4 text-blue-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Import Data</p>
              <p className="text-xs text-slate-500">Restore from a JSON export file</p>
            </div>
          </div>
          <p className="mb-4 text-xs text-slate-500">
            Import a previously exported JSON file. Only recognised storage keys will be
            written. Existing data will be overwritten.
          </p>
          <input ref={fileInputRef} type="file" accept=".json,application/json" className="hidden" onChange={handleFileChange} />
          <button
            onClick={handleImportClick}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
          >
            <Upload className="h-4 w-4" />
            Choose JSON File & Import
          </button>
        </div>

        {/* Reset */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <div className="rounded-md bg-amber-50 p-2">
              <RotateCcw className="h-4 w-4 text-amber-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Reset to Seed Defaults</p>
              <p className="text-xs text-slate-500">Restore demo/seed data</p>
            </div>
          </div>
          <p className="mb-4 text-xs text-slate-500">
            Clears all runtime data and reloads the application with seed records
            (3 pracharakas, 4 patients, sample screening, wish list and alerts).
            <span className="font-semibold text-amber-700"> All unsaved changes will be lost.</span>
          </p>
          {!confirmReset ? (
            <button
              onClick={() => setConfirmReset(true)}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to Seed Data
            </button>
          ) : (
            <div className="space-y-2">
              <p className="rounded bg-red-50 px-3 py-2 text-xs font-medium text-red-700 border border-red-200">
                ⚠ This will permanently clear all current data. Are you sure?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleResetConfirm}
                  className="flex-1 rounded-md bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700"
                >
                  Yes, Reset Now
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Inspect */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <div className="rounded-md bg-slate-100 p-2">
              <Database className="h-4 w-4 text-slate-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Inspect Storage</p>
              <p className="text-xs text-slate-500">View all domain key sizes</p>
            </div>
          </div>
          <p className="mb-4 text-xs text-slate-500">
            Inspect the current state of all localStorage domains — see which keys have data and how many bytes each occupies.
          </p>
          <button
            onClick={handleInspect}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
          >
            <Database className="h-4 w-4" />
            Inspect Storage Keys
          </button>
        </div>
      </div>

      {/* Storage inspection results */}
      {storageInspect && (
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-700">Storage Domain Inspection</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left">
                  <th className="px-4 py-2 text-xs font-medium text-slate-500">Key</th>
                  <th className="px-4 py-2 text-xs font-medium text-slate-500">Status</th>
                  <th className="px-4 py-2 text-xs font-medium text-slate-500">Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {storageInspect.map((row) => (
                  <tr key={row.key} className="hover:bg-slate-50">
                    <td className="px-4 py-2 font-mono text-xs text-slate-600">{row.key}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex rounded px-2 py-0.5 text-[11px] font-medium ${row.hasData ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {row.hasData ? "Has Data" : "Empty"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-500">
                      {row.bytes > 0 ? `${(row.bytes / 1024).toFixed(1)} KB` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">
            Total: {(storageInspect.reduce((acc, r) => acc + r.bytes, 0) / 1024).toFixed(1)} KB across {storageInspect.filter((r) => r.hasData).length} populated keys
          </div>
        </div>
      )}
    </div>
  );
}
