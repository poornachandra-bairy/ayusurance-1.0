"use client";
import { useAppStore } from "@/lib/store/useAppStore";
import { PageHeader } from "@/app/components/shell/PageHeader";
import documentRequirements from "@/data/document-requirements.json";

export function DocumentsPage() {
  const { documents, patients } = useAppStore();
  return (
    <div className="space-y-5 max-w-5xl">
      <PageHeader title="Documents" subtitle="Centralised document repository for consents, reports, prescriptions and correspondence." />
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm p-4">
        <p className="text-sm font-semibold text-slate-700 mb-3">Document Types ({documentRequirements.documentTypes.length} defined)</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="px-3 py-2 text-xs font-medium text-slate-500">Document</th>
                <th className="px-3 py-2 text-xs font-medium text-slate-500">Stage</th>
                <th className="px-3 py-2 text-xs font-medium text-slate-500">Required</th>
                <th className="px-3 py-2 text-xs font-medium text-slate-500">Formats</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {documentRequirements.documentTypes.map((dt) => (
                <tr key={dt.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2.5">
                    <p className="font-medium text-slate-800 text-xs">{dt.label}</p>
                    <p className="text-[10px] text-slate-400">{dt.description}</p>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-500">{dt.stageId}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex rounded px-2 py-0.5 text-[11px] font-medium ${dt.required ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-500"}`}>
                      {dt.required ? "Required" : "Optional"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-500">{dt.format.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
        Document upload & management per patient — Phase 2
      </div>
    </div>
  );
}
