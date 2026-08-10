"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronsLeft } from "lucide-react";
import { NAV_ITEMS, SECONDARY_NAV_ITEMS } from "@/config/nav";
import { resolveIcon } from "@/components/layout/icon-map";
import { useUser } from "@/components/providers/supabase-provider";
import { can } from "@/lib/rbac";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/types";

export function NavLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const pathname = usePathname();
  const Icon = resolveIcon(item.icon);
  const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
  return (
    <Link href={item.href} title={collapsed ? item.label : undefined} className={cn("group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition", active ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950")}>
      <Icon className="relative z-10 h-[18px] w-[18px] shrink-0" />
      {!collapsed && <span className="relative z-10 truncate">{item.label}</span>}
    </Link>
  );
}

const groups = [
  { label: "Workspace", items: ["/dashboard", "/sites", "/clients", "/vendors"] },
  { label: "Commercial", items: ["/quotations", "/purchase-orders", "/invoices", "/expenses", "/salary", "/billing"] },
  { label: "Records", items: ["/analytics", "/documents"] },
];

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void; brand: { name: string; tagline: string; logoUrl?: string | null } }) {
  const user = useUser();
  const role = user?.role ?? "ADMIN";
  const visible = NAV_ITEMS.filter((item) => can(role, item.module, "view"));
  const secondary = SECONDARY_NAV_ITEMS.filter((item) => can(role, item.module, "view"));

  return (
    <motion.aside initial={false} animate={{ width: collapsed ? 76 : 274 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="relative hidden shrink-0 flex-col border-r border-slate-200 bg-white text-slate-950 md:flex">
      <div className={cn("flex h-[72px] items-center border-b border-slate-100", collapsed ? "justify-center px-2" : "px-4")}>
        {collapsed ? <img src="/brand/ratneswar-symbol.png" alt="Ratneswar Engineering" className="h-11 w-11 object-contain" /> : <img src="/brand/ratneswar-wordmark.png" alt="Ratneswar Engineering" className="h-[50px] w-[205px] object-contain object-left" />}
      </div>
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-5">
          {groups.map((group) => {
            const items = group.items.map((href) => visible.find((v) => v.href === href)).filter(Boolean) as NavItem[];
            if (!items.length) return null;
            return <section key={group.label}>{!collapsed && <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.19em] text-slate-400">{group.label}</p>}<nav className="space-y-1">{items.map((item) => <NavLink key={item.href} item={item} collapsed={collapsed} />)}</nav></section>;
          })}
          {secondary.length > 0 && <section className="border-t border-slate-100 pt-4">{!collapsed && <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.19em] text-slate-400">Administration</p>}<nav className="space-y-1">{secondary.map((item) => <NavLink key={item.href} item={item} collapsed={collapsed} />)}</nav></section>}
        </div>
      </ScrollArea>
      {!collapsed && <div className="mx-3 mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-800">Ratneswar secure workspace</p><p className="mt-1 text-[10px] leading-4 text-slate-500">Owner and Admin access only. Financial details stay inside their respective modules.</p></div>}
      <button onClick={onToggle} className="flex items-center gap-2 border-t border-slate-100 px-4 py-3 text-xs font-medium text-slate-500 transition hover:text-slate-900"><ChevronsLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />{!collapsed && "Collapse sidebar"}</button>
    </motion.aside>
  );
}
