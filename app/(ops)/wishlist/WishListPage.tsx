"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store/useAppStore";
import { PageHeader } from "@/app/components/shell/PageHeader";
import { formatDate, daysAgo } from "@/lib/utils/date";
import type { WishListV2Status } from "@/lib/types/wishlist";
import { cn } from "@/lib/utils/cn";
import { Search, Plus, FileText, ChevronRight, CheckCircle2, User, HelpCircle, Send } from "lucide-react";

export function WishListPage() {
  const { wishListV2Entries, pracharakas } = useAppStore();
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [statusFilter, setStatusFilter] = useState<WishListV2Status | "all">("all");
  const [pracharakaFilter, setPracharakaFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return wishListV2Entries
      .filter((wl) => {
        if (q && !wl.data.fullName.toLowerCase().includes(q) && !wl.id.toLowerCase().includes(q)) {
          return false;
        }
        if (statusFilter !== "all" && wl.status !== statusFilter) return false;
        if (pracharakaFilter !== "all" && wl.pracharakaId !== pracharakaFilter) return false;
        return true;
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [wishListV2Entries, search, statusFilter, pracharakaFilter]);

  const stats = {
    total: wishListV2Entries.length,
    drafts: wishListV2Entries.filter((w) => w.status === "draft").length,
    submitted: wishListV2Entries.filter((w) => w.status === "submitted").length,
    forwarded: wishListV2Entries.filter((w) => w.status === "forwarded").length,
  };

  const statusIcons: Record<WishListV2Status, React.ElementType> = {
    draft: HelpCircle,
    submitted: Send,
    verified: CheckCircle2,
    forwarded: CheckCircle2,
  };

  const statusClasses: Record<WishListV2Status, string> = {
    draft: "bg-slate-100 text-slate-700 border-slate-200",
    submitted: "bg-blue-50 text-blue-700 border-blue-200",
    verified: "bg-indigo-50 text-indigo-700 border-indigo-200",
    forwarded: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  const statusLabels: Record<WishListV2Status, string> = {
    draft: "Draft",
    submitted: "Submitted",
    verified: "Verified",
    forwarded: "Astro Forwarded",
  };

  if (!mounted) return null;

  return (
    <div className="space-y-5 max-w-7xl">
      <PageHeader
        title="Patient Wish Lists"
        subtitle="Manage new prospective patients and referral forms submitted by Pracharakas."
        actions={
          <Link
            href="/wishlist/new"
            className="inline-flex items-center gap-2 rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Wish List
          </Link>
        }
      />

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Entries" value={stats.total} icon={FileText} color="text-slate-600" bg="bg-slate-50" />
        <StatCard label="Drafts" value={stats.drafts} icon={HelpCircle} color="text-slate-600" bg="bg-slate-100" />
        <StatCard label="Submitted (Pending)" value={stats.submitted} icon={Send} color="text-blue-600" bg="bg-blue-50" />
        <StatCard label="Astro Forwarded" value={stats.forwarded} icon={CheckCircle2} color="text-emerald-600" bg="bg-emerald-50" />
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by patient name or ID…"
              className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 pl-8 pr-3 text-sm text-slate-700 focus:border-blue-400 focus:bg-white focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:border-blue-400 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Drafts</option>
            <option value="submitted">Submitted</option>
            <option value="verified">Verified</option>
            <option value="forwarded">Astro Forwarded</option>
          </select>

          <select
            value={pracharakaFilter}
            onChange={(e) => setPracharakaFilter(e.target.value)}
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:border-blue-400 focus:outline-none"
          >
            <option value="all">All Pracharakas</option>
            {pracharakas.map((pr) => (
              <option key={pr.id} value={pr.id}>
                {pr.name} ({pr.id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white py-16 text-center">
          <FileText className="mx-auto mb-2 h-6 w-6 text-slate-300" />
          <p className="text-sm text-slate-400">No wish list entries found matching filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((wl) => {
            const pr = pracharakas.find((p) => p.id === wl.pracharakaId);
            const Icon = statusIcons[wl.status];

            return (
              <Link 
                key={wl.id} 
                href={`/wishlist/${wl.id}`}
                className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700">
                      {wl.data.fullName ? wl.data.fullName.slice(0, 2).toUpperCase() : "??"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{wl.data.fullName || "—"}</p>
                      <p className="text-[10px] text-slate-400">{wl.id}</p>
                    </div>
                  </div>
                  <span className={cn("inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium", statusClasses[wl.status])}>
                    <Icon className="h-2.5 w-2.5" />
                    {statusLabels[wl.status]}
                  </span>
                </div>

                {/* Info grid */}
                <div className="space-y-1.5 mb-3 flex-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Location</span>
                    <span className="font-medium text-slate-700 truncate max-w-[60%]">{wl.data.placeOfResidence || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Pracharaka</span>
                    <span className="font-medium text-slate-700 truncate max-w-[60%]">{pr?.name || wl.pracharakaId}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Updated</span>
                    <span className="font-medium text-slate-700">{daysAgo(wl.updatedAt)}</span>
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-auto border-t border-slate-100 pt-3 flex items-center justify-end">
                  <span className="text-[11px] font-medium text-slate-400 group-hover:text-blue-600 flex items-center gap-1 transition-colors">
                    View <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, bg }: { label: string; value: number | string; icon: any; color: string; bg: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <div className={cn("rounded-md p-1.5", bg)}>
          <Icon className={cn("h-4 w-4", color)} />
        </div>
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
