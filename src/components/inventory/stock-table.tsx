import Link from "next/link";
import { Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Muted } from "@/components/ui/typography";
import { ReceiveStockDialog, IssueStockDialog } from "@/components/inventory/receive-issue-dialogs";
import { TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import type { StockItemListItem } from "@/lib/queries/inventory";

export function StockTable({
  items, stores, vendors,
}: {
  items: StockItemListItem[];
  stores: { id: string; name: string }[];
  vendors: { id: string; name: string }[];
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <Package className="h-8 w-8 text-muted-foreground/50" />
        <p className="font-medium">No materials yet</p>
        <Muted className="max-w-sm">Add a material to the catalog, then receive stock against a store.</Muted>
      </div>
    );
  }

  return (
    <TableContainer>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Material</TableHead><TableHead>Category</TableHead>
            <TableHead className="text-right">Balance</TableHead><TableHead className="text-right">Reorder Level</TableHead>
            <TableHead>Status</TableHead><TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((it) => (
            <TableRow key={it.id}>
              <TableCell>
                <Link href={`/inventory/${it.id}`} className="hover:text-brand-gold-light">
                  <p className="text-sm font-medium">{it.name}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">{it.sku}</p>
                </Link>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{it.category}</TableCell>
              <TableCell className="tabular text-right font-mono text-sm">{it.balance} {it.unit}</TableCell>
              <TableCell className="tabular text-right font-mono text-sm text-muted-foreground">{it.reorderLevel} {it.unit}</TableCell>
              <TableCell>
                {it.isLowStock ? <Badge variant="destructive">Low Stock</Badge> : <Badge variant="success">OK</Badge>}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1.5">
                  <ReceiveStockDialog stockItemId={it.id} stores={stores} vendors={vendors} />
                  <IssueStockDialog stockItemId={it.id} stores={stores} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
