import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { getStockItemDetail } from "@/lib/queries/inventory";
import { getVendors, getStores } from "@/lib/queries/inventory";
import { ItemQr } from "@/components/inventory/item-qr";
import { ReceiveStockDialog, IssueStockDialog } from "@/components/inventory/receive-issue-dialogs";
import { StockItemFormDialog } from "@/components/inventory/stock-item-form-dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Muted } from "@/components/ui/typography";
import { formatDate, formatINR } from "@/lib/utils";
import { TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getStockItemDetail(id);
  return { title: item ? `${item.name} · Ratneswar ERP` : "Material · Ratneswar ERP" };
}

export default async function StockItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePermission("inventory", "view");
  const [item, vendors, stores] = await Promise.all([
    getStockItemDetail(id), getVendors(), getStores(),
  ]);

  if (!item) notFound();

  const storeOptions = stores.map((s) => ({ id: s.id, name: s.name }));
  const vendorOptions = vendors.map((v) => ({ id: v.id, name: v.name }));

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 py-6 md:px-8">
      <div className="card-3d flex flex-col gap-4 p-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <ItemQr sku={item.sku} name={item.name} />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold">{item.name}</h1>
              {item.balance <= item.reorderLevel ? <Badge variant="destructive">Low Stock</Badge> : <Badge variant="success">OK</Badge>}
            </div>
            <Muted className="mt-1 text-sm">{item.category} · {item.balance} {item.unit} in stock · Reorder at {item.reorderLevel} {item.unit}</Muted>
            {item.standardRate !== null && <Muted className="mt-0.5 text-xs">Standard rate: {formatINR(item.standardRate)} / {item.unit}</Muted>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <StockItemFormDialog item={item} suggestedSku={item.sku} />
          <ReceiveStockDialog stockItemId={item.id} stores={storeOptions} vendors={vendorOptions} />
          <IssueStockDialog stockItemId={item.id} stores={storeOptions} />
        </div>
      </div>

      {item.storeBreakdown.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          {item.storeBreakdown.map((s, i) => (
            <Card key={i} variant="3d" className="p-4">
              <Muted className="text-xs">{s.name}</Muted>
              <p className="tabular mt-1 font-mono text-lg font-semibold">{s.balance} {item.unit}</p>
            </Card>
          ))}
        </div>
      )}

      <Card variant="3d" className="p-6">
        <h2 className="mb-4 text-sm font-semibold">Transaction History</h2>
        {item.transactions.length === 0 ? (
          <Muted className="text-xs">No transactions yet.</Muted>
        ) : (
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Store</TableHead><TableHead>Vendor / Issued To</TableHead><TableHead className="text-right">Qty</TableHead><TableHead>Ref.</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {item.transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-sm">{formatDate(t.date)}</TableCell>
                    <TableCell><Badge variant={t.type === "RECEIVE" ? "success" : "info"}>{t.type}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.store.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.vendor?.name ?? t.issuedTo ?? "—"}</TableCell>
                    <TableCell className={`tabular text-right font-mono text-sm ${t.type === "RECEIVE" ? "text-success" : "text-destructive"}`}>
                      {t.type === "RECEIVE" ? "+" : "-"}{t.quantity}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{t.referenceNo ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </div>
  );
}
