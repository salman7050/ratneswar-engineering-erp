import { ShoppingCart } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { getPurchaseOrders } from "@/lib/queries/purchase-orders";
import { POListPanel } from "@/components/purchase-orders/po-list-panel";
import { Muted } from "@/components/ui/typography";

export const metadata = { title: "Purchase Orders · Ratneswar ERP" };
export const dynamic = "force-dynamic";

export default async function PurchaseOrdersPage() {
  await requirePermission("purchase_orders", "view");
  const pos = await getPurchaseOrders();

  return (
    <div className="flex h-[calc(100dvh-4rem)]">
      <aside className="w-full shrink-0 border-r border-border/60 md:w-[320px]">
        <POListPanel pos={pos as any} />
      </aside>
      <div className="hidden flex-1 flex-col items-center justify-center gap-3 p-8 text-center md:flex">
        <ShoppingCart className="h-10 w-10 text-muted-foreground/40" />
        <p className="font-medium">Select a purchase order</p>
        <Muted className="max-w-sm">Choose one from the list, or create a new one to get started.</Muted>
      </div>
    </div>
  );
}
