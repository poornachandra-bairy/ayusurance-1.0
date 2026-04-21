"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

const SEGMENT_LABELS: Record<string, string> = {
  dashboard:         "Dashboard",
  pracharaka:        "Pracharaka Program",
  "wish-list":       "Wish List",
  "astro-eligibility": "Astro Eligibility",
  screening:         "Medical Screening",
  "treatment-plan":  "Treatment Plan",
  "pk-consultation": "PK Consultation",
  reservation:       "Reservation & Orientation",
  "patient-portal":  "Patient Portal",
  "travel-payment":  "Travel & Payment",
  admission:         "Arrival & Admission",
  documents:         "Documents",
  "quality-control": "Quality Control",
  settings:          "Settings",
};

export function AppBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs = segments.map((seg, idx) => {
    const href = "/" + segments.slice(0, idx + 1).join("/");
    const label = SEGMENT_LABELS[seg] ?? seg;
    const isLast = idx === segments.length - 1;
    return { href, label, isLast };
  });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-slate-500">
      <Link href="/dashboard" className="flex items-center gap-1 hover:text-slate-700 transition-colors">
        <Home className="h-3 w-3" />
        <span>Home</span>
      </Link>
      {crumbs.map((crumb) => (
        <span key={crumb.href} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3 text-slate-300" />
          {crumb.isLast ? (
            <span className="font-medium text-slate-700">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-slate-700 transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
