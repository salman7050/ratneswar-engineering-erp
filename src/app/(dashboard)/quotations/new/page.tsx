import { requirePermission } from "@/lib/auth";
import { getQuotationMasterOptions } from "@/lib/queries/quotations";
import { getSites } from "@/lib/queries/sites";
import { getBankAccounts, getCompanySettings, getSignatureAssets } from "@/lib/queries/finance-settings";
import { SmartQuotationEditor } from "@/components/quotations/smart-quotation-editor";

export const metadata = { title: "New Quotation · Ratneswar ERP" };
export const dynamic = "force-dynamic";

export default async function NewQuotationPage({ searchParams }: { searchParams?: Promise<{ tenderId?: string }> }) {
  const filters = await searchParams;
  const user = await requirePermission("quotations", "create");
  const [clients, sites, bankAccounts, company, signatures] = await Promise.all([
    getQuotationMasterOptions(), getSites(), getBankAccounts(), getCompanySettings(), getSignatureAssets(),
  ]);
  return <SmartQuotationEditor clients={clients} sites={sites} bankAccounts={bankAccounts} canUseAI={user.role === "ADMIN" || user.role === "OWNER"} defaultTerms={company.defaultQuoteTerms} defaultValidityDays={company.quotationValidityDays} signatures={signatures} presetTenderId={filters?.tenderId} />;
}
