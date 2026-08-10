import Link from "next/link";
import { ShoppingCart, Receipt, FileText, Users2, Wallet, ChevronRight, ShieldCheck } from "lucide-react";
import { MissionPanel } from "@/components/dashboard/mission-panel";
import { StatusChip } from "@/components/ui/status-chip";

interface Approvals {
  purchaseOrders: number;
  invoices: number;
  quotations: number;
  leaves: number;
  expenses: number;
  total: number;
}

export function ApprovalsPanel({ approvals }: { approvals: Approvals }) {
  const items = [
    { label: "Purchase Orders", count: approvals.purchaseOrders, href: "/purchase-orders", icon: ShoppingCart },
    { label: "Invoices", count: approvals.invoices, href: "/invoices", icon: Receipt },
    { label: "Quotations", count: approvals.quotations, href: "/quotations", icon: FileText },
    { label: "Leave Requests", count: approvals.leaves, href: "/employees", icon: Users2 },
    { label: "Expenses", count: approvals.expenses, href: "/expenses", icon: Wallet },
  ];

  return (
    <MissionPanel
      title="Today's Approvals"
      tint={approvals.total > 0 ? "gold" : "neutral"}
      action={
        <StatusChip tone={approvals.total > 0 ? "warning" : "success"}>
          {approvals.total > 0 ? `${approvals.total} pending` : "Nothing pending"}
        </StatusChip>
      }
    >
      {approvals.total === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <ShieldCheck className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Everything&apos;s approved. Nothing waiting on you.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {items.filter((i) => i.count > 0).map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-secondary/20 px-3 py-2.5 transition-colors hover:border-brand-gold/30 hover:bg-secondary/40"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/60">
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span className="text-sm font-semibold tabular text-foreground">{item.count}</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </MissionPanel>
  );
}
