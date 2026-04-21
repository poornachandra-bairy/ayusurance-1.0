"use client";
import type { Metadata } from "next";
import { AppHeader } from "@/app/components/shell/AppHeader";
import { AppSidebar } from "@/app/components/shell/AppSidebar";
import { AppBreadcrumb } from "@/app/components/shell/AppBreadcrumb";
import { StatusStrip } from "@/app/components/shell/StatusStrip";
import { RoleProvider } from "@/lib/context/RoleContext";

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleProvider>
      <div className="flex h-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AppHeader />
          <StatusStrip />
          <div className="flex flex-1 flex-col overflow-y-auto">
            <div className="border-b border-slate-100 bg-white px-6 py-2">
              <AppBreadcrumb />
            </div>
            <main className="flex-1 px-6 py-5">{children}</main>
          </div>
        </div>
      </div>
    </RoleProvider>
  );
}
