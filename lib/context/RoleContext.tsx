"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type AppRole =
  | "admin"
  | "ayusurance"
  | "pracharaka"
  | "astrologer"
  | "screening_vaidya"
  | "treating_vaidya"
  | "aco";

export interface RoleConfig {
  id: AppRole;
  label: string;
  shortLabel: string;
  color: string;         // Tailwind bg class
  textColor: string;     // Tailwind text class
  borderColor: string;   // Tailwind border class
  description: string;
  navItems: string[];    // allowed href prefixes; [] = all
}

export const ROLE_CONFIGS: RoleConfig[] = [
  {
    id: "admin",
    label: "Admin",
    shortLabel: "Admin",
    color: "bg-slate-800",
    textColor: "text-white",
    borderColor: "border-slate-800",
    description: "Full system access",
    navItems: [], // all
  },
  {
    id: "ayusurance",
    label: "Ayusurance Coordinator",
    shortLabel: "Coordinator",
    color: "bg-emerald-700",
    textColor: "text-white",
    borderColor: "border-emerald-700",
    description: "Pipeline oversight, onboarding, portal management",
    navItems: ["/dashboard", "/patients", "/wishlist", "/astro", "/screening", "/reservation", "/patient-portal", "/travel-payment", "/documents", "/quality-control", "/settings"],
  },
  {
    id: "pracharaka",
    label: "Pracharaka",
    shortLabel: "Pracharaka",
    color: "bg-amber-600",
    textColor: "text-white",
    borderColor: "border-amber-600",
    description: "Referrals, wish lists, patient support",
    navItems: ["/dashboard", "/pracharaka", "/wishlist", "/patients", "/screening"],
  },
  {
    id: "astrologer",
    label: "Astrologer",
    shortLabel: "Astrologer",
    color: "bg-violet-700",
    textColor: "text-white",
    borderColor: "border-violet-700",
    description: "Astrochart evaluations and eligibility",
    navItems: ["/dashboard", "/astro"],
  },
  {
    id: "screening_vaidya",
    label: "Screening Vaidya",
    shortLabel: "Scr. Vaidya",
    color: "bg-teal-700",
    textColor: "text-white",
    borderColor: "border-teal-700",
    description: "Medical screening consultations",
    navItems: ["/dashboard", "/screening", "/patients"],
  },
  {
    id: "treating_vaidya",
    label: "Treating Vaidya",
    shortLabel: "Trt. Vaidya",
    color: "bg-indigo-700",
    textColor: "text-white",
    borderColor: "border-indigo-700",
    description: "Treatment plans, PK consultations, active treatment",
    navItems: ["/dashboard", "/treatment-plan", "/pk-consultation", "/active-treatment", "/patients"],
  },
  {
    id: "aco",
    label: "ACO (Center Organizer)",
    shortLabel: "ACO",
    color: "bg-rose-700",
    textColor: "text-white",
    borderColor: "border-rose-700",
    description: "Arrival, admission, center operations, active treatment",
    navItems: ["/dashboard", "/travel-payment", "/active-treatment", "/documents", "/patients"],
  },
];

const STORAGE_KEY = "ayusurance_role";

interface RoleContextValue {
  role: AppRole;
  config: RoleConfig;
  setRole: (role: AppRole) => void;
  canAccess: (href: string) => boolean;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<AppRole>("admin");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as AppRole | null;
    if (saved && ROLE_CONFIGS.find((r) => r.id === saved)) setRoleState(saved);
  }, []);

  function setRole(r: AppRole) {
    setRoleState(r);
    localStorage.setItem(STORAGE_KEY, r);
  }

  const config = ROLE_CONFIGS.find((r) => r.id === role) ?? ROLE_CONFIGS[0];

  function canAccess(href: string): boolean {
    if (config.navItems.length === 0) return true;
    return config.navItems.some((allowed) => href === allowed || href.startsWith(allowed + "/"));
  }

  return (
    <RoleContext.Provider value={{ role, config, setRole, canAccess }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
