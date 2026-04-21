"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppStore } from "@/lib/store/useAppStore";
import { PageHeader } from "@/app/components/shell/PageHeader";
import type { WishListV2Data, WishListV2Entry } from "@/lib/types/wishlist";
import schemaData from "@/data/wishlist-schema.json";
import { nowISO } from "@/lib/utils/date";
import { ArrowLeft, Save, Send, AlertCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const INITIAL_DATA: WishListV2Data = {
  fullName: "",
  gender: "",
  dateOfBirth: "",
  placeOfBirth: "",
  timeOfBirth: "",
  email: "",
  whatsappNumber: "",
  placeOfResidence: "",
  occupation: "",
  healthConcerns: "",
  seekingAyurveda: "",
  previousTreatments: "",
  availabilityTimeframe: "",
};

export function WishListForm() {
  const router = useRouter();
  const { pracharakas, wishListV2Entries, saveWishListDraft, submitWishList } = useAppStore();

  const [data, setData] = useState<WishListV2Data>(INITIAL_DATA);
  const [pracharakaId, setPracharakaId] = useState<string>("");
  const [errors, setErrors] = useState<Partial<Record<keyof WishListV2Data | "pracharakaId", string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(field: keyof WishListV2Data, value: string) {
    setData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate(final: boolean): boolean {
    const e: Partial<Record<keyof WishListV2Data | "pracharakaId", string>> = {};

    if (!pracharakaId) e.pracharakaId = "Referring Pracharaka is required";

    if (final) {
      schemaData.sections.forEach((sec) => {
        sec.fields.forEach((f) => {
          if (f.required && !data[f.id as keyof WishListV2Data]?.trim()) {
            e[f.id as keyof WishListV2Data] = `${f.label} is required`;
          }
        });
      });
      // Email spec
      if (data.email && !data.email.includes("@")) e.email = "Valid email required";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ID generator logic (would be server-side in real app)
  const getNextWlId = () => {
    const maxNum = Math.max(
      0,
      ...wishListV2Entries.map((w) => {
        const m = w.id.match(/WLV2-(\d+)/);
        return m ? parseInt(m[1], 10) : 0;
      })
    );
    return `WLV2-${String(maxNum + 1).padStart(3, "0")}`;
  };

  const [draftId, setDraftId] = useState<string | null>(null);

  function handleSaveDraft() {
    if (!validate(false)) return;

    const entryId = draftId || getNextWlId();
    if (!draftId) setDraftId(entryId);

    const draft: WishListV2Entry = {
      id: entryId,
      pracharakaId,
      status: "draft",
      data,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };

    saveWishListDraft(draft);
    alert("Draft saved successfully.");
  }

  function handleSubmit() {
    if (!validate(true)) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsSubmitting(true);
    const entryId = draftId || getNextWlId();

    const finalizedEntry: WishListV2Entry = {
      id: entryId,
      pracharakaId,
      status: "draft", // saved as draft first, then submitted
      data,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };

    saveWishListDraft(finalizedEntry);
    submitWishList(entryId);

    setTimeout(() => {
      router.push(`/wishlist/${entryId}`);
    }, 500);
  }

  const inputCls = "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400";

  return (
    <div className="max-w-4xl space-y-5 pb-10">
      <div>
        <Link href="/wishlist" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> All Wish Lists
        </Link>
      </div>

      <PageHeader
        title="Create Patient Wish List"
        subtitle="Refer a new prospective patient. All sections must be fully completed before submission to Astro-timing."
      />

      {Object.keys(errors).length > 0 && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-red-800">
            <AlertCircle className="h-4 w-4" /> Please correct the errors below
          </div>
        </div>
      )}

      {/* Pracharaka Selection */}
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-slate-800">Referring Pracharaka</h2>
        <div className="max-w-md">
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Select Pracharaka <span className="text-red-500">*</span>
          </label>
          <select
            value={pracharakaId}
            onChange={(e) => {
              setPracharakaId(e.target.value);
              if (errors.pracharakaId) setErrors((prev) => ({ ...prev, pracharakaId: undefined }));
            }}
            className={inputCls}
          >
            <option value="">— Select —</option>
            {pracharakas.map((pr) => (
              <option key={pr.id} value={pr.id}>
                {pr.name} ({pr.id})
              </option>
            ))}
          </select>
          {errors.pracharakaId && <p className="mt-1 text-[11px] text-red-600">{errors.pracharakaId}</p>}
        </div>
      </section>

      {/* Schema Driven Sections */}
      {schemaData.sections.map((section) => (
        <section key={section.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-400" /> {section.title}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">{section.description}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {section.fields.map((field) => {
              const val = data[field.id as keyof WishListV2Data];
              const err = errors[field.id as keyof WishListV2Data];
              const isFullW = field.type === "textarea" || field.id === "availabilityTimeframe";

              return (
                <div key={field.id} className={cn(isFullW && "sm:col-span-2")}>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      value={val}
                      onChange={(e) => handleChange(field.id as keyof WishListV2Data, e.target.value)}
                      placeholder={(field as any).placeholder}
                      rows={(field as any).rows}
                      className={cn(inputCls, "resize-none")}
                    />
                  ) : field.type === "select" ? (
                    <select
                      value={val}
                      onChange={(e) => handleChange(field.id as keyof WishListV2Data, e.target.value)}
                      className={inputCls}
                    >
                      <option value="">— Select —</option>
                      {(field as any).options.map((opt: string) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      value={val}
                      onChange={(e) => handleChange(field.id as keyof WishListV2Data, e.target.value)}
                      placeholder={(field as any).placeholder}
                      className={inputCls}
                    />
                  )}
                  {err && <p className="mt-1 text-[11px] text-red-600">{err}</p>}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {/* Action Bar */}
      <div className="sticky bottom-4 mt-8 flex items-center justify-between rounded-lg border border-slate-200 bg-white/90 p-4 shadow-lg backdrop-blur-md">
        <Link href="/wishlist" className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
          Cancel
        </Link>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none"
          >
            <Save className="h-4 w-4 text-slate-400" />
            Save Draft
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? "Submitting..." : "Submit to Ayusurance"}
          </button>
        </div>
      </div>
    </div>
  );
}
