"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronsLeft, ShieldCheck } from "lucide-react";
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
    <Link href={item.href} title={collapsed ? item.label : undefined} className={cn("group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all", active ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_10px_24px_-14px_rgba(37,99,235,.85)]" : "text-slate-600 hover:bg-blue-50/80 hover:text-blue-800")}>
      <Icon className="relative z-10 h-[18px] w-[18px] shrink-0" />
      {!collapsed && <span className="relative z-10 truncate">{item.label}</span>}
      {active && !collapsed && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_0_3px_rgba(110,231,183,.18)]" />}
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
    <motion.aside initial={false} animate={{ width: collapsed ? 76 : 274 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="erp-glass-surface relative z-20 m-3 mr-3 hidden shrink-0 flex-col overflow-hidden rounded-[26px] text-slate-950 md:flex">
      <div className={cn("flex h-[78px] items-center border-b border-blue-100/70", collapsed ? "justify-center px-2" : "px-4")}>
        {collapsed ? <img src="/brand/ratneswar-symbol.png" alt="Ratneswar Engineering" className="h-11 w-11 object-contain" /> : <img src="/brand/ratneswar-wordmark.png" alt="Ratneswar Engineering" className="h-[50px] w-[205px] object-contain object-left" />}
      </div>
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-5">
          {groups.map((group) => {
            const items = group.items.map((href) => visible.find((v) => v.href === href)).filter(Boolean) as NavItem[];
            if (!items.length) return null;
            return <section key={group.label}>{!collapsed && <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.19em] text-blue-400/80">{group.label}</p>}<nav className="space-y-1">{items.map((item) => <NavLink key={item.href} item={item} collapsed={collapsed} />)}</nav></section>;
          })}
          {secondary.length > 0 && <section className="border-t border-blue-100/70 pt-4">{!collapsed && <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.19em] text-blue-400/80">Administration</p>}<nav className="space-y-1">{secondary.map((item) => <NavLink key={item.href} item={item} collapsed={collapsed} />)}</nav></section>}
        </div>
      </ScrollArea>
      {!collapsed && <div className="mx-3 mb-3 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/90 to-blue-50/90 p-3"><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600" /><p className="text-xs font-semibold text-slate-800">Secure workspace</p></div><p className="mt-1.5 text-[10px] leading-4 text-slate-500">Owner and Admin access only. Business data stays protected.</p></div>}
      <button onClick={onToggle} className="flex items-center gap-2 border-t border-blue-100/70 px-4 py-3 text-xs font-medium text-slate-500 transition hover:bg-blue-50/60 hover:text-blue-800"><ChevronsLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />{!collapsed && "Collapse sidebar"}</button>
    </motion.aside>
  );
}
