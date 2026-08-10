import { AlertTriangle, Clock3, CheckCircle2 } from "lucide-react";
import { StatusChip } from "@/components/ui/status-chip";
import { Muted } from "@/components/ui/typography";
import { formatINR } from "@/lib/utils";

export function NotificationsPanel({
  upcomingEmds,
  overdueInvoices,
}: {
  upcomingEmds: { id: string; name: string; tenderNo: string; daysLeft: number }[];
  overdueInvoices: { id: string; invoiceNo: string; buyerName: string; grandTotal: number }[];
}) {
  const total = upcomingEmds.length + overdueInvoices.length;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
        <CheckCircle2 className="h-6 w-6 text-success/60" />
        <Muted className="text-xs">All clear — no EMD deadlines or overdue invoices right now.</Muted>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {overdueInvoices.map((inv) => (
        <li
          key={inv.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/[0.06] px-3 py-2"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
            <div className="min-w-0">
              <p className="truncate text-xs font-medium">{inv.invoiceNo}</p>
              <p className="truncate text-[10px] text-muted-foreground">{inv.buyerName} — overdue</p>
            </div>
          </div>
          <span className="tabular shrink-0 font-mono text-xs font-semibold text-destructive">
            {formatINR(inv.grandTotal)}
          </span>
        </li>
      ))}
      {upcomingEmds.map((t) => (
        <li
          key={t.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-warning/20 bg-warning/[0.06] px-3 py-2"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Clock3 className="h-4 w-4 shrink-0 text-warning" />
            <div className="min-w-0">
              <p className="truncate text-xs font-medium">{t.name}</p>
              <p className="truncate text-[10px] text-muted-foreground">{t.tenderNo}</p>
            </div>
          </div>
          <StatusChip tone="warning" className="shrink-0">
            {t.daysLeft === 0 ? "Due today" : `${t.daysLeft}d left`}
          </StatusChip>
        </li>
      ))}
    </ul>
  );
}
