import Link from "next/link";
import { HardHat } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { getStockItems, getVendors, getStores, suggestNextSku } from "@/lib/queries/inventory";
import { getSites } from "@/lib/queries/sites";
import { StockItemFormDialog } from "@/components/inventory/stock-item-form-dialog";
import { StockTable } from "@/components/inventory/stock-table";
import { LowStockAlerts } from "@/components/inventory/low-stock-alerts";
import { VendorsPanel } from "@/components/inventory/vendors-panel";
import { StoresPanel } from "@/components/inventory/stores-panel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eyebrow, H1, Muted } from "@/components/ui/typography";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const metadata = { title: "Inventory · Ratneswar ERP" };
export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  await requirePermission("inventory", "view");
  const [items, vendors, stores, sites, suggestedSku] = await Promise.all([
    getStockItems(), getVendors(), getStores(), getSites(), suggestNextSku(),
  ]);

  const lowStockCount = items.filter((i) => i.isLowStock).length;
  const storeOptions = stores.map((s) => ({ id: s.id, name: s.name }));
  const vendorOptions = vendors.map((v) => ({ id: v.id, name: v.name }));

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-6 md:px-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Eyebrow className="text-brand-gold-light/80">Ratneswar Engineering</Eyebrow>
          <H1 className="text-2xl md:text-3xl">Inventory</H1>
          <Muted className="mt-1">{items.length} material{items.length === 1 ? "" : "s"} · {stores.length} store{stores.length === 1 ? "" : "s"}{lowStockCount > 0 ? ` · ${lowStockCount} low stock` : ""}</Muted>
        </div>
        <div className="flex gap-2">
          <Button variant="glass" asChild><Link href="/inventory/assets"><HardHat className="h-4 w-4" /> Tools & Equipment</Link></Button>
          <StockItemFormDialog suggestedSku={suggestedSku} />
        </div>
      </div>

      <Tabs defaultValue="stock">
        <TabsList>
          <TabsTrigger value="stock">Stock</TabsTrigger>
          <TabsTrigger value="alerts">
            Low Stock {lowStockCount > 0 && <Badge variant="destructive" className="ml-1.5">{lowStockCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="stores">Stores</TabsTrigger>
        </TabsList>

        <TabsContent value="stock">
          <Card variant="3d" className="p-6">
            <StockTable items={items} stores={storeOptions} vendors={vendorOptions} />
          </Card>
        </TabsContent>
        <TabsContent value="alerts">
          <Card variant="3d" className="p-6">
            <LowStockAlerts items={items} stores={storeOptions} vendors={vendorOptions} />
          </Card>
        </TabsContent>
        <TabsContent value="vendors">
          <Card variant="3d" className="p-6"><VendorsPanel vendors={vendors} /></Card>
        </TabsContent>
        <TabsContent value="stores">
          <Card variant="3d" className="p-6"><StoresPanel stores={stores} sites={sites} /></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
