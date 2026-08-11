"use client";

import * as React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { AssistantLauncher } from "@/components/ai-assistant/assistant-launcher";

export function DashboardShell({ children, brand }: { children: React.ReactNode; brand: { name: string; tagline: string; logoUrl?: string | null } }) {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div className="erp-shell relative flex h-dvh w-full overflow-hidden">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} brand={brand} />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col py-3 pr-3 max-md:p-0">
        <Topbar brand={brand} />
        <main className="erp-main mt-3 flex-1 overflow-y-auto rounded-[24px] scrollbar-thin max-md:mt-0 max-md:rounded-none">{children}</main>
      </div>
      <AssistantLauncher />
    </div>
  );
}
