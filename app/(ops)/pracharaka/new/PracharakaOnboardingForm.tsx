"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppStore } from "@/lib/store/useAppStore";
import { PageHeader } from "@/app/components/shell/PageHeader";
import type {
  PracharakaEligibilityCategoryId,
  PracharakaCertificationStatus,
} from "@/lib/types/pracharaka";
import { ALL_MILESTONE_IDS, ALL_TRAINING_MODULE_IDS } from "@/lib/types/pracharaka";
import type { Pracharaka } from "@/lib/types";
import eligibilityCategoriesData from "@/data/pracharaka-eligibility-categories.json";
import milestonesData from "@/data/pracharaka-onboarding-milestones.json";
import { todayISO, nowISO } from "@/lib/utils/date";
import { ArrowLeft, Save, User, Phone, Mail, MapPin, Tag, Award, CheckSquare, Square } from "lucide-react";

interface FormState {
  name: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  country: string;
  eligibilityCategory: PracharakaEligibilityCategoryId | "";
  certificationStatus: PracharakaCertificationStatus;
  ayusuranceRegistrationStatus: "not_registered" | "registered";
  communicationGroupAdded: boolean;
  referralFormatsProvided: boolean;
  responsibilitiesAcknowledged: boolean;
  notes: string;
}

const INITIAL_FORM: FormState = {
  name: "",
  phone: "",
  email: "",
  city: "",
  state: "",
  country: "",
  eligibilityCategory: "",
  certificationStatus: "not_enrolled",
  ayusuranceRegistrationStatus: "not_registered",
  communicationGroupAdded: false,
  referralFormatsProvided: false,
  responsibilitiesAcknowledged: false,
  notes: "",
};

const CERT_STATUS_OPTIONS: { value: PracharakaCertificationStatus; label: string }[] = [
  { value: "not_enrolled",       label: "Not Enrolled" },
  { value: "enrolled",           label: "Enrolled — Fee Paid" },
  { value: "in_training",        label: "In Training" },
  { value: "assessment_pending", label: "Assessment Pending" },
  { value: "certified",          label: "SHIVA Certified" },
  { value: "lapsed",             label: "Certification Lapsed" },
];

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400";

export function PracharakaOnboardingForm() {
  const router = useRouter();
  const { addFullPracharaka, pracharakas } = useAppStore();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [newId, setNewId] = useState<string>("");

  function change(field: keyof FormState, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  }

  function validate(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.phone.trim()) e.phone = "Phone is required";
    if (!form.email.trim() || !form.email.includes("@")) e.email = "Valid email required";
    if (!form.city.trim()) e.city = "City is required";
    if (!form.state.trim()) e.state = "State / Region is required";
    if (!form.eligibilityCategory) e.eligibilityCategory = "Eligibility category is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    // Generate expected ID for redirect (reducer does the real gen, but we can predict it)
    const maxNum = Math.max(0, ...pracharakas.map(p => {
      const m = p.id.match(/PR-(\d+)/);
      return m ? parseInt(m[1], 10) : 0;
    }));
    const predictedId = `PR-${String(maxNum + 1).padStart(3, "0")}`;

    const pracharakaPayload: Omit<Pracharaka, "id"> = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      country: form.country.trim() || undefined,
      joinedDate: todayISO(),
      status: "pending_verification",
      totalReferrals: 0,
      agreementSigned: false,
      notes: form.notes.trim() || undefined,
    };

    const blankMilestones = Object.fromEntries(ALL_MILESTONE_IDS.map(id => [id, false])) as Record<string, boolean>;
    const now = nowISO();

    addFullPracharaka(pracharakaPayload, {
      eligibilityCategory: form.eligibilityCategory as PracharakaEligibilityCategoryId,
      certificationStatus: form.certificationStatus,
      ayusuranceRegistrationStatus: form.ayusuranceRegistrationStatus,
      ayusuranceRegisteredAt: form.ayusuranceRegistrationStatus === "registered" ? now : undefined,
      communicationGroupAdded: form.communicationGroupAdded,
      communicationGroupAddedAt: form.communicationGroupAdded ? now : undefined,
      referralFormatsProvided: form.referralFormatsProvided,
      referralFormatsProvidedAt: form.referralFormatsProvided ? now : undefined,
      responsibilitiesAcknowledged: form.responsibilitiesAcknowledged,
      responsibilitiesAcknowledgedAt: form.responsibilitiesAcknowledged ? now : undefined,
      onboardingMilestones: blankMilestones,
      notes: form.notes.trim() || undefined,
    });

    setNewId(predictedId);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 max-w-md mx-auto text-center space-y-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <CheckSquare className="h-7 w-7 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Pracharaka Added</h2>
          <p className="mt-1 text-sm text-slate-600">
            <strong>{form.name}</strong> has been registered with ID <strong>{newId}</strong>.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/pracharaka/${newId}`}
            className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            View Profile
          </Link>
          <Link
            href="/pracharaka"
            className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Back to List
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <Link href="/pracharaka" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> All Pracharakas
        </Link>
      </div>

      <PageHeader
        title="Register New Pracharaka"
        subtitle="Onboard a new SHIVA Programme referral partner. All fields marked * are required."
      />

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* ── Personal Details ─────────────────────────────── */}
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <User className="h-4 w-4 text-slate-400" />
            Personal Details
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Full Name" required>
              <input
                id="pr-name"
                type="text"
                value={form.name}
                onChange={e => change("name", e.target.value)}
                placeholder="e.g. Dr. Ananya Krishnan"
                className={inputCls}
              />
              {errors.name && <p className="mt-1 text-[11px] text-red-600">{errors.name}</p>}
            </FormField>

            <FormField label="Phone" required>
              <input
                id="pr-phone"
                type="tel"
                value={form.phone}
                onChange={e => change("phone", e.target.value)}
                placeholder="+91-98450-00000"
                className={inputCls}
              />
              {errors.phone && <p className="mt-1 text-[11px] text-red-600">{errors.phone}</p>}
            </FormField>

            <FormField label="Email Address" required>
              <input
                id="pr-email"
                type="email"
                value={form.email}
                onChange={e => change("email", e.target.value)}
                placeholder="name@example.com"
                className={inputCls}
              />
              {errors.email && <p className="mt-1 text-[11px] text-red-600">{errors.email}</p>}
            </FormField>

            <FormField label="City" required>
              <input
                id="pr-city"
                type="text"
                value={form.city}
                onChange={e => change("city", e.target.value)}
                placeholder="e.g. Kochi"
                className={inputCls}
              />
              {errors.city && <p className="mt-1 text-[11px] text-red-600">{errors.city}</p>}
            </FormField>

            <FormField label="State / Region" required>
              <input
                id="pr-state"
                type="text"
                value={form.state}
                onChange={e => change("state", e.target.value)}
                placeholder="e.g. Kerala"
                className={inputCls}
              />
              {errors.state && <p className="mt-1 text-[11px] text-red-600">{errors.state}</p>}
            </FormField>

            <FormField label="Country (if outside India)">
              <input
                id="pr-country"
                type="text"
                value={form.country}
                onChange={e => change("country", e.target.value)}
                placeholder="e.g. UAE"
                className={inputCls}
              />
            </FormField>
          </div>
        </section>

        {/* ── Programme Details ─────────────────────────────── */}
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Tag className="h-4 w-4 text-slate-400" />
            Programme Details
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Eligibility Category" required>
              <select
                id="pr-category"
                value={form.eligibilityCategory}
                onChange={e => change("eligibilityCategory", e.target.value)}
                className={inputCls}
              >
                <option value="">— Select a category —</option>
                {eligibilityCategoriesData.categories.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
              {errors.eligibilityCategory && <p className="mt-1 text-[11px] text-red-600">{errors.eligibilityCategory}</p>}
              {form.eligibilityCategory && (
                <p className="mt-1.5 text-[10px] text-slate-400 leading-snug">
                  {eligibilityCategoriesData.categories.find(c => c.id === form.eligibilityCategory)?.rationale}
                </p>
              )}
            </FormField>

            <FormField label="Certification Status" required>
              <select
                id="pr-cert-status"
                value={form.certificationStatus}
                onChange={e => change("certificationStatus", e.target.value as PracharakaCertificationStatus)}
                className={inputCls}
              >
                {CERT_STATUS_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </FormField>
          </div>
        </section>

        {/* ── Onboarding Status ─────────────────────────────── */}
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Award className="h-4 w-4 text-slate-400" />
            Onboarding Status
          </h2>

          <FormField label="Ayusurance Platform Registration">
            <select
              id="pr-registration"
              value={form.ayusuranceRegistrationStatus}
              onChange={e => change("ayusuranceRegistrationStatus", e.target.value as "not_registered" | "registered")}
              className={inputCls}
            >
              <option value="not_registered">Not yet registered</option>
              <option value="registered">Registered on Ayusurance Platform</option>
            </select>
          </FormField>

          <div className="grid gap-3">
            {[
              { field: "communicationGroupAdded" as keyof FormState, label: "Added to Pracharaka communication group (WhatsApp / platform)" },
              { field: "referralFormatsProvided" as keyof FormState, label: "Referral formats and templates provided to Pracharaka" },
              { field: "responsibilitiesAcknowledged" as keyof FormState, label: "Pracharaka responsibilities and code of conduct acknowledged" },
            ].map(({ field, label }) => (
              <label key={field} className="flex items-start gap-3 cursor-pointer group">
                <div
                  className="mt-0.5 shrink-0"
                  onClick={() => change(field, !form[field])}
                >
                  {form[field] ? (
                    <CheckSquare className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Square className="h-4 w-4 text-slate-300 group-hover:text-slate-400" />
                  )}
                </div>
                <span
                  className="text-sm text-slate-700 leading-snug"
                  onClick={() => change(field, !form[field])}
                >
                  {label}
                </span>
              </label>
            ))}
          </div>
        </section>

        {/* ── Notes ────────────────────────────────────────── */}
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <FormField label="Onboarding Notes">
            <textarea
              id="pr-notes"
              value={form.notes}
              onChange={e => change("notes", e.target.value)}
              rows={3}
              placeholder="Any additional context, background, or coordinator notes about this Pracharaka…"
              className={`${inputCls} resize-none`}
            />
          </FormField>
        </section>

        {/* ── Submit ────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4 pb-4">
          <Link
            href="/pracharaka"
            className="text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-md bg-slate-800 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-700 transition-colors"
          >
            <Save className="h-4 w-4" />
            Register Pracharaka
          </button>
        </div>
      </form>
    </div>
  );
}
