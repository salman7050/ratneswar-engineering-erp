import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { StatusChip } from "@/components/ui/status-chip";
import { Muted } from "@/components/ui/typography";
import { ReceiveStockDialog } from "@/components/inventory/receive-issue-dialogs";
import type { StockItemListItem } from "@/lib/queries/inventory";

export function LowStockAlerts({
  items, stores, vendors,
}: {
  items: StockItemListItem[];
  stores: { id: string; name: string }[];
  vendors: { id: string; name: string }[];
}) {
  const lowStock = items.filter((i) => i.isLowStock);

  if (lowStock.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <CheckCircle2 className="h-6 w-6 text-success/60" />
        <Muted className="text-xs">All materials are above their reorder level.</Muted>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {lowStock.map((it) => (
        <li key={it.id} className="flex items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/[0.06] px-3 py-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{it.name}</p>
              <Muted className="text-[11px] font-mono">{it.sku}</Muted>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <StatusChip tone="destructive">{it.balance} / {it.reorderLevel} {it.unit}</StatusChip>
            <ReceiveStockDialog stockItemId={it.id} stores={stores} vendors={vendors} />
          </div>
        </li>
      ))}
    </ul>
  );
}
