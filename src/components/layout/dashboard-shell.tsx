"use client";

import * as React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { AssistantLauncher } from "@/components/ai-assistant/assistant-launcher";

export function DashboardShell({ children, brand }: { children: React.ReactNode; brand: { name: string; tagline: string; logoUrl?: string | null } }) {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[#f5f7fb]">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} brand={brand} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar brand={brand} />
        <main className="flex-1 overflow-y-auto scrollbar-thin">{children}</main>
      </div>
      <AssistantLauncher />
    </div>
  );
}
