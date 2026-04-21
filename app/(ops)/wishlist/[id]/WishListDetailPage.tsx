"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useAppStore } from "@/lib/store/useAppStore";
import type { WishListV2Status } from "@/lib/types/wishlist";
import schemaData from "@/data/wishlist-schema.json";
import { formatDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import { ArrowLeft, CheckCircle2, User, HelpCircle, Send, Star, ArrowRight } from "lucide-react";

export function WishListDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { wishListV2ById, pracharakaById, verifyWishList, forwardWishList, patientById } = useAppStore();

  const wl = wishListV2ById(id);
  const pr = wl ? pracharakaById(wl.pracharakaId) : undefined;
  const generatedPatient = wl?.patientId ? patientById(wl.patientId) : undefined;

  if (!wl) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <User className="mb-3 h-10 w-10 text-slate-300" />
        <p className="text-sm font-medium text-slate-600">Wish List not found</p>
        <p className="text-xs text-slate-400">ID: {id}</p>
        <Link href="/wishlist" className="mt-4 text-xs text-blue-600 hover:underline flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" /> All Wish Lists
        </Link>
      </div>
    );
  }

  const statusIcons: Record<WishListV2Status, React.ElementType> = {
    draft: HelpCircle,
    submitted: Send,
    verified: CheckCircle2,
    forwarded: Star,
  };

  const statusClasses: Record<WishListV2Status, string> = {
    draft: "bg-slate-100 text-slate-700 border-slate-200",
    submitted: "bg-blue-50 text-blue-700 border-blue-200",
    verified: "bg-indigo-50 text-indigo-700 border-indigo-200",
    forwarded: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  const statusLabels: Record<WishListV2Status, string> = {
    draft: "Draft — Incomplete",
    submitted: "Submitted — Review Pending",
    verified: "Verified by Coordinator",
    forwarded: "Forwarded for Astro Evaluation",
  };

  const Icon = statusIcons[wl.status];

  return (
    <div className="max-w-4xl space-y-5 pb-10">
      <Link href="/wishlist" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> All Wish Lists
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900">{wl.data.fullName || "Unnamed Patient"}</h1>
            <span className={cn("inline-flex items-center gap-1.5 rounded border px-2.5 py-0.5 text-xs font-medium", statusClasses[wl.status])}>
              <Icon className="h-3.5 w-3.5" />
              {statusLabels[wl.status]}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-4 text-sm text-slate-500">
            <span>ID: {wl.id}</span>
            <span>Created: {formatDate(wl.createdAt)}</span>
            {wl.submittedAt && <span>Submitted: {formatDate(wl.submittedAt)}</span>}
          </div>
        </div>
        
        {/* Actions side */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {wl.status === "submitted" && (
            <button
              onClick={() => verifyWishList(wl.id)}
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors"
            >
              Verify Details
            </button>
          )}
          {wl.status === "verified" && (
            <button
              onClick={() => forwardWishList(wl.id)}
              className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 transition-colors"
            >
              Forward for Astrochart Evaluation
            </button>
          )}

          {generatedPatient && (
             <Link
             href={`/patients/${generatedPatient.id}`}
             className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
           >
             View Generated Patient Profile <ArrowRight className="h-3 w-3" />
           </Link>
          )}
        </div>
      </div>

      {/* Pracharaka Summary */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-2">Referring Pracharaka</p>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 shrink-0 rounded-full bg-slate-200 flex items-center justify-center">
            <User className="h-4 w-4 text-slate-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {pr ? pr.name : wl.pracharakaId}
              {pr && <span className="ml-2 text-[10px] font-normal text-slate-500">{pr.id} · {pr.city}</span>}
            </p>
            {pr && <p className="text-xs text-slate-600">{pr.phone} · {pr.email}</p>}
          </div>
        </div>
      </div>

      {/* Schema Driven Display */}
      {schemaData.sections.map((section) => (
        <section key={section.id} className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-800">{section.title}</h2>
          </div>
          <div className="grid gap-1 px-5 py-4 sm:grid-cols-2 lg:grid-cols-3">
            {section.fields.map((field) => {
              const val = wl.data[field.id as keyof typeof wl.data];
              const isFullW = field.type === "textarea" || field.id === "availabilityTimeframe";
              return (
                <div key={field.id} className={cn("py-2", isFullW && "sm:col-span-2 lg:col-span-3")}>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-0.5">
                    {field.label}
                  </p>
                  <p className={cn("text-sm text-slate-800 leading-relaxed", !val && "text-slate-400 italic")}>
                    {val || "Not provided"}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      ))}

    </div>
  );
}
