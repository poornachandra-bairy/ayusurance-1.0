"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store/useAppStore";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { CertificationStatusBadge } from "@/app/components/pracharaka/CertificationStatusBadge";
import { OnboardingProgressBar } from "@/app/components/pracharaka/OnboardingProgressBar";
import type { PracharakaCertificationStatus, PracharakaEligibilityCategoryId } from "@/lib/types/pracharaka";
import { PRACHARAKA_ELIGIBILITY_CATEGORY_LABELS } from "@/lib/types/pracharaka";
import { formatDate, daysAgo } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import {
  Search, Plus, ChevronRight, X, Users, CheckCircle2,
  MessageSquare, AlertTriangle,
} from "lucide-react";
import eligibilityCategoriesData from "@/data/pracharaka-eligibility-categories.json";

const ALL_CERT_STATUSES: PracharakaCertificationStatus[] = [
  "not_enrolled", "enrolled", "in_training", "assessment_pending", "certified", "lapsed",
];
const CERT_STATUS_LABELS: Record<PracharakaCertificationStatus, string> = {
  not_enrolled:       "Not Enrolled",
  enrolled:           "Enrolled",
  in_training:        "In Training",
  assessment_pending: "Assessment Pending",
  certified:          "SHIVA Certified",
  lapsed:             "Certification Lapsed",
};

export function PracharakaPage() {
  const {
    pracharakas, pracharakaProfiles, pracharakaProfileById,
    trainingCompletionCount, onboardingCompletionCount,
    patientsByPracharaka,
  } = useAppStore();

  // ── Filters ────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [certFilter, setCertFilter] = useState<PracharakaCertificationStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<PracharakaEligibilityCategoryId | "all">("all");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return pracharakas.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q) && !p.id.toLowerCase().includes(q) && !p.city.toLowerCase().includes(q)) {
        return false;
      }
      const profile = pracharakaProfileById(p.id);
      if (certFilter !== "all" && profile?.certificationStatus !== certFilter) return false;
      if (categoryFilter !== "all" && profile?.eligibilityCategory !== categoryFilter) return false;
      return true;
    });
  }, [pracharakas, pracharakaProfiles, search, certFilter, categoryFilter]);

  const hasFilters = search || certFilter !== "all" || categoryFilter !== "all";

  // ── Summary counts ─────────────────────────────────────────
  const certifiedCount = pracharakaProfiles.filter(p => p.certificationStatus === "certified").length;
  const inTrainingCount = pracharakaProfiles.filter(p => p.certificationStatus === "in_training" || p.certificationStatus === "enrolled").length;
  const commGroupCount = pracharakaProfiles.filter(p => p.communicationGroupAdded).length;
  const totalReferrals = pracharakas.reduce((s, p) => s + (p.totalReferrals ?? 0), 0);

  return (
    <div className="space-y-5 max-w-7xl">
      <PageHeader
        title="Pracharaka Program"
        subtitle="Manage the SHIVA Certified Pracharaka network — referral partners, certification status, and onboarding progress."
        actions={
          <Link
            href="/pracharaka/new"
            className="inline-flex items-center gap-2 rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Pracharaka
          </Link>
        }
      />

      {/* ── Summary stats ──────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Pracharakas", value: pracharakas.length, icon: Users,        color: "text-blue-600",    bg: "bg-blue-50" },
          { label: "SHIVA Certified",   value: certifiedCount,     icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "In Training",       value: inTrainingCount,    icon: AlertTriangle,color: "text-amber-600",   bg: "bg-amber-50" },
          { label: "Total Referrals",   value: totalReferrals,     icon: MessageSquare,color: "text-indigo-600",  bg: "bg-indigo-50" },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                <div className={`rounded-md p-1.5 ${stat.bg}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* ── Search + Filters ───────────────────────────────── */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              id="pracharaka-search"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, ID, or city…"
              className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 pl-8 pr-3 text-sm text-slate-700 placeholder-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>

          <select
            id="cert-filter"
            value={certFilter}
            onChange={e => setCertFilter(e.target.value as PracharakaCertificationStatus | "all")}
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:border-blue-400 focus:outline-none"
          >
            <option value="all">All Cert. Statuses</option>
            {ALL_CERT_STATUSES.map(s => (
              <option key={s} value={s}>{CERT_STATUS_LABELS[s]}</option>
            ))}
          </select>

          <select
            id="category-filter"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value as PracharakaEligibilityCategoryId | "all")}
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:border-blue-400 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {eligibilityCategoriesData.categories.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>

          {hasFilters && (
            <button
              onClick={() => { setSearch(""); setCertFilter("all"); setCategoryFilter("all"); }}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 px-2.5 text-xs text-slate-500 hover:bg-slate-50"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>
        <p className="mt-2 text-[11px] text-slate-400">
          Showing {filtered.length} of {pracharakas.length} Pracharaka{pracharakas.length !== 1 ? "s" : ""}
          {hasFilters ? " (filtered)" : ""}
        </p>
      </div>

      {/* ── Pracharaka table ───────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white py-16 text-center">
          <Users className="mx-auto mb-2 h-6 w-6 text-slate-300" />
          <p className="text-sm text-slate-400">No Pracharakas match your filters.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left">
                <th className="px-4 py-2.5 text-xs font-medium text-slate-500">Pracharaka</th>
                <th className="px-4 py-2.5 text-xs font-medium text-slate-500">Eligibility Category</th>
                <th className="px-4 py-2.5 text-xs font-medium text-slate-500">Certification</th>
                <th className="px-4 py-2.5 text-xs font-medium text-slate-500">Training</th>
                <th className="px-4 py-2.5 text-xs font-medium text-slate-500">Onboarding</th>
                <th className="px-4 py-2.5 text-xs font-medium text-slate-500">Comm. Group</th>
                <th className="px-4 py-2.5 text-xs font-medium text-slate-500">Referrals</th>
                <th className="px-4 py-2.5 text-xs font-medium text-slate-500">Joined</th>
                <th className="px-4 py-2.5 text-xs font-medium text-slate-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((pr) => {
                const profile = pracharakaProfileById(pr.id);
                const training = trainingCompletionCount(pr.id);
                const onboarding = onboardingCompletionCount(pr.id);
                const patients = patientsByPracharaka(pr.id);
                const categoryLabel = profile
                  ? PRACHARAKA_ELIGIBILITY_CATEGORY_LABELS[profile.eligibilityCategory]
                  : "—";
                const needsAttention =
                  !pr.agreementSigned ||
                  profile?.certificationStatus === "lapsed" ||
                  (profile && !profile.communicationGroupAdded && profile.certificationStatus === "certified");

                return (
                  <tr key={pr.id} className={cn("group transition-colors hover:bg-slate-50", needsAttention ? "bg-amber-50/30" : "")}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        {needsAttention && <AlertTriangle className="h-3 w-3 shrink-0 text-amber-500" />}
                        <div>
                          <p className="font-medium text-slate-800">{pr.name}</p>
                          <p className="text-[10px] text-slate-400">{pr.id} · {pr.city}, {pr.state}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <p className="text-xs text-slate-700">{categoryLabel}</p>
                    </td>
                    <td className="px-4 py-2.5">
                      {profile ? (
                        <CertificationStatusBadge status={profile.certificationStatus} size="sm" />
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 min-w-[100px]">
                      <OnboardingProgressBar
                        completed={training.completed}
                        total={training.total}
                        size="sm"
                      />
                    </td>
                    <td className="px-4 py-2.5 min-w-[100px]">
                      <OnboardingProgressBar
                        completed={onboarding.completed}
                        total={onboarding.total}
                        size="sm"
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      {profile ? (
                        <span className={cn(
                          "inline-flex items-center rounded border px-1.5 py-0 text-[10px] font-medium",
                          profile.communicationGroupAdded
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-slate-50 text-slate-500"
                        )}>
                          {profile.communicationGroupAdded ? "Added" : "Pending"}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-700 font-medium">
                      {patients.length}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-400">
                      {formatDate(pr.joinedDate)}
                    </td>
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/pracharaka/${pr.id}`}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-50"
                      >
                        View <ChevronRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
