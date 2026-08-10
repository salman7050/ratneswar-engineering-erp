import { notFound, redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { getPurchaseOrderDetail } from "@/lib/queries/purchase-orders";
import { getSiteOptions } from "@/lib/queries/command-center";
import { getVendorOptions } from "@/lib/queries/purchase-orders";
import { getBankAccounts, getCompanySettings, getSignatureAssets } from "@/lib/queries/finance-settings";
import { POForm } from "@/components/purchase-orders/po-form";
import { H1, Muted } from "@/components/ui/typography";

export const dynamic = "force-dynamic";

export default async function EditPurchaseOrderPage({ params }: { params: { id: string } }) {
  await requirePermission("purchase_orders", "edit");
  const [po, sites, vendors, bankAccounts, signatures, company] = await Promise.all([
    getPurchaseOrderDetail(params.id),
    getSiteOptions(),
    getVendorOptions(),
    getBankAccounts(),
    getSignatureAssets(),
    getCompanySettings(),
  ]);

  if (!po) notFound();
  if (po.status !== "DRAFT") redirect(`/purchase-orders/${po.id}`);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-6 md:px-8">
      <div>
        <H1 className="text-2xl md:text-3xl">Edit {po.poNo}</H1>
        <Muted className="mt-1">Draft purchase orders can be edited freely before approval.</Muted>
      </div>
      <POForm mode="edit" po={po} sites={sites} vendors={vendors as any} bankAccounts={bankAccounts} signatures={signatures} defaultTerms={company.defaultPoTerms} defaultDeliveryAddress={company.address} />
    </div>
  );
}
