import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { getPurchaseOrders, getPurchaseOrderDetail } from "@/lib/queries/purchase-orders";
import { getCompanySettings } from "@/lib/queries/finance-settings";
import { POListPanel } from "@/components/purchase-orders/po-list-panel";
import { PODetailView } from "@/components/purchase-orders/po-detail-view";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const po = await getPurchaseOrderDetail(id);
  return { title: po ? `${po.poNo} · Ratneswar ERP` : "Purchase Order · Ratneswar ERP" };
}

export default async function PurchaseOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePermission("purchase_orders", "view");
  const [po, pos, company] = await Promise.all([
    getPurchaseOrderDetail(id),
    getPurchaseOrders(),
    getCompanySettings(),
  ]);

  if (!po) notFound();

  return (
    <div className="flex h-[calc(100dvh-4rem)]">
      <aside className="hidden w-[320px] shrink-0 border-r border-border/60 md:block">
        <POListPanel pos={pos as any} selectedId={po.id} />
      </aside>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <Link href="/purchase-orders" className="flex items-center gap-1.5 border-b border-border/60 px-4 py-3 text-xs text-muted-foreground md:hidden">
          <ChevronLeft className="h-3.5 w-3.5" /> All purchase orders
        </Link>
        <div className="p-4 md:p-6">
          <PODetailView po={po} company={company} userRole={user.role} />
        </div>
      </div>
    </div>
  );
}
