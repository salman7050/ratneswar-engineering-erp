import { requirePermission } from "@/lib/auth";
import { getSiteOptions } from "@/lib/queries/command-center";
import { getVendorOptions } from "@/lib/queries/purchase-orders";
import { getBankAccounts, getCompanySettings, getSignatureAssets } from "@/lib/queries/finance-settings";
import { POForm } from "@/components/purchase-orders/po-form";
import { H1, Muted } from "@/components/ui/typography";

export const metadata = { title: "New Purchase Order · Ratneswar ERP" };
export const dynamic = "force-dynamic";

export default async function NewPurchaseOrderPage() {
  await requirePermission("purchase_orders", "create");
  const [sites, vendors, bankAccounts, signatures, company] = await Promise.all([
    getSiteOptions(),
    getVendorOptions(),
    getBankAccounts(),
    getSignatureAssets(),
    getCompanySettings(),
  ]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-6 md:px-8">
      <div>
        <H1 className="text-2xl md:text-3xl">New Purchase Order</H1>
        <Muted className="mt-1">Saved as a draft first — send it for approval once it&apos;s ready.</Muted>
      </div>
      <POForm mode="create" sites={sites} vendors={vendors as any} bankAccounts={bankAccounts} signatures={signatures} defaultTerms={company.defaultPoTerms} defaultDeliveryAddress={company.address} />
    </div>
  );
}
