"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PO_STATUS_META, PO_PRIORITY_META } from "./po-utils";
import { formatINR, formatDate, cn } from "@/lib/utils";

export interface POListRow {
  id: string;
  poNo: string;
  date: Date | string;
  vendorName: string;
  status: string;
  priority: string;
  grandTotal: number;
  site: { id: string; name: string } | null;
}

const STATUSES = ["DRAFT", "PENDING_APPROVAL", "APPROVED", "ISSUED", "PARTIALLY_RECEIVED", "COMPLETED", "CANCELLED", "REJECTED"];

export function POListPanel({ pos, selectedId }: { pos: POListRow[]; selectedId?: string }) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState("ALL");
  const [dateFilter, setDateFilter] = React.useState("ALL");

  const filtered = React.useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart); weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return pos.filter((p) => {
      if (status !== "ALL" && p.status !== status) return false;
      if (dateFilter !== "ALL") {
        const d = new Date(p.date);
        if (dateFilter === "TODAY" && d < todayStart) return false;
        if (dateFilter === "WEEK" && d < weekStart) return false;
        if (dateFilter === "MONTH" && d < monthStart) return false;
      }
      if (query) {
        const q = query.toLowerCase();
        const haystack = `${p.poNo} ${p.vendorName} ${p.site?.name ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [pos, query, status, dateFilter]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-3">
        <p className="text-sm font-semibold">Purchase Orders</p>
        <Button size="sm" variant="gold" onClick={() => router.push("/purchase-orders/new")}>
          <Plus className="h-3.5 w-3.5" /> New
        </Button>
      </div>

      <div className="flex flex-col gap-2 border-b border-border/60 px-3 py-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Vendor, PO no., site…"
            className="h-8 pl-8 text-xs"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{PO_STATUS_META[s]?.label ?? s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All dates</SelectItem>
              <SelectItem value="TODAY">Today</SelectItem>
              <SelectItem value="WEEK">This week</SelectItem>
              <SelectItem value="MONTH">This month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-xs text-muted-foreground">No purchase orders match.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border/50">
            {filtered.map((p) => {
              const statusMeta = PO_STATUS_META[p.status] ?? { label: p.status, tone: "neutral" as const, dot: "bg-muted-foreground" };
              const priorityMeta = PO_PRIORITY_META[p.priority] ?? { label: p.priority, dot: "bg-info" };
              const active = p.id === selectedId;
              return (
                <li key={p.id}>
                  <Link
                    href={`/purchase-orders/${p.id}`}
                    className={cn(
                      "flex flex-col gap-1 px-3 py-3 transition-colors",
                      active ? "bg-brand-gold/[0.08] border-l-2 border-l-brand-gold" : "border-l-2 border-l-transparent hover:bg-secondary/30"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-mono text-xs font-semibold">{p.poNo}</span>
                      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", priorityMeta.dot)} title={`${priorityMeta.label} priority`} />
                    </div>
                    <p className="truncate text-sm font-medium">{p.vendorName}</p>
                    <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                      <span>{formatDate(p.date)}{p.site ? ` · ${p.site.name}` : ""}</span>
                      <span className="font-mono tabular text-foreground">{formatINR(p.grandTotal)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={cn("h-1.5 w-1.5 rounded-full", statusMeta.dot)} />
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{statusMeta.label}</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
