import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { getQuotationDetail, getQuotationMasterOptions } from "@/lib/queries/quotations";
import { getSites } from "@/lib/queries/sites";
import { getBankAccounts, getCompanySettings, getSignatureAssets } from "@/lib/queries/finance-settings";
import { SmartQuotationEditor } from "@/components/quotations/smart-quotation-editor";

export const dynamic = "force-dynamic";

export default async function EditQuotationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePermission("quotations", "edit");
  const [quotation, clients, sites, bankAccounts, company, signatures] = await Promise.all([
    getQuotationDetail(id), getQuotationMasterOptions(), getSites(), getBankAccounts(), getCompanySettings(), getSignatureAssets(),
  ]);
  if (!quotation) notFound();
  return <SmartQuotationEditor quotation={quotation} clients={clients} sites={sites} bankAccounts={bankAccounts} canUseAI={user.role === "ADMIN" || user.role === "OWNER"} defaultTerms={company.defaultQuoteTerms} defaultValidityDays={company.quotationValidityDays} signatures={signatures} />;
}
