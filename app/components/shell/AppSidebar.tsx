"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Users2, ClipboardList, Star,
  Stethoscope, FileText, MessageSquare, CalendarCheck,
  Globe, CreditCard, LogIn, FolderOpen, ShieldCheck,
  Settings, ChevronRight, Activity, Syringe,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useRole } from "@/lib/context/RoleContext";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  stageNumber?: number;
  group: "workflow" | "management";
}

const ALL_NAV_ITEMS: NavItem[] = [
  // Workflow stages
  { href: "/dashboard",       label: "Dashboard",             icon: LayoutDashboard, group: "management" },
  { href: "/patients",        label: "All Patients",          icon: Users2,           group: "management" },
  { href: "/pracharaka",      label: "Pracharaka Program",    icon: Users,            group: "workflow", stageNumber: 1 },
  { href: "/wishlist",        label: "Wish List",             icon: ClipboardList,    group: "workflow", stageNumber: 2 },
  { href: "/astro",           label: "Astro Eligibility",     icon: Star,             group: "workflow", stageNumber: 3 },
  { href: "/screening",       label: "Medical Screening",     icon: Stethoscope,      group: "workflow", stageNumber: 4 },
  { href: "/treatment-plan",  label: "Treatment Plan",        icon: FileText,         group: "workflow", stageNumber: 5 },
  { href: "/pk-consultation", label: "PK Consultation",       icon: MessageSquare,    group: "workflow", stageNumber: 6 },
  { href: "/reservation",     label: "Reservation & Kit",     icon: CalendarCheck,    group: "workflow", stageNumber: 7 },
  { href: "/patient-portal",  label: "Patient Portal",        icon: Globe,            group: "workflow", stageNumber: 8 },
  { href: "/travel-payment",  label: "Travel & Payment",      icon: CreditCard,       group: "workflow", stageNumber: 9 },
  { href: "/travel-payment",  label: "Arrival & Admission",   icon: LogIn,            group: "workflow", stageNumber: 10 },
  { href: "/active-treatment", label: "Active Treatment",     icon: Syringe,          group: "workflow", stageNumber: 11 },
  // Management
  { href: "/shiva-academy",   label: "SHIVA Academy",         icon: Activity,         group: "management" },
  { href: "/documents",       label: "Documents",             icon: FolderOpen,       group: "management" },
  { href: "/quality-control", label: "Quality Control",       icon: ShieldCheck,      group: "management" },
  { href: "/settings",        label: "Settings",              icon: Settings,         group: "management" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { config, canAccess } = useRole();

  const visible = ALL_NAV_ITEMS.filter((item) => canAccess(item.href));
  const workflow   = visible.filter((i) => i.group === "workflow");
  const management = visible.filter((i) => i.group === "management");

  function NavLink({ item }: { item: NavItem }) {
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
    const Icon = item.icon;
    return (
      <Link
        href={item.href}
        className={cn(
          "group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
          isActive
            ? "bg-emerald-50 text-emerald-800 font-medium"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        )}
      >
        {item.stageNumber ? (
          <span className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold",
            isActive ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
          )}>
            {item.stageNumber}
          </span>
        ) : (
          <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-emerald-700" : "text-slate-400 group-hover:text-slate-500")} />
        )}
        <span className="truncate">{item.label}</span>
        {isActive && <ChevronRight className="ml-auto h-3 w-3 shrink-0 text-emerald-500" />}
      </Link>
    );
  }

  return (
    <aside className="flex h-full w-56 flex-col border-r border-slate-200 bg-white shadow-sm">
      {/* Brand */}
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-slate-200 px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-700">
          <Activity className="h-4 w-4 text-white" />
        </div>
        <div className="leading-none">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-700">Ayusurance</p>
          <p className="text-[10px] text-slate-400">Ops Platform</p>
        </div>
      </div>

      {/* Role badge */}
      <div className={cn("flex items-center gap-2 border-b border-slate-100 px-3 py-2", config.color)}>
        <div className="h-1.5 w-1.5 rounded-full bg-white/60" />
        <p className={cn("text-[10px] font-semibold tracking-wide truncate", config.textColor)}>{config.label}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {workflow.length > 0 && (
          <>
            <div className="mb-1 px-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Workflow</div>
            {workflow.map((item) => <NavLink key={`${item.href}-${item.stageNumber}`} item={item} />)}
          </>
        )}

        {management.length > 0 && (
          <>
            <div className="my-2 border-t border-slate-100" />
            <div className="mb-1 px-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Management</div>
            {management.map((item) => <NavLink key={item.href} item={item} />)}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-slate-200 px-4 py-3">
        <p className="text-[10px] text-slate-400">Sadaika Wellness · v1.0</p>
      </div>
    </aside>
  );
}
