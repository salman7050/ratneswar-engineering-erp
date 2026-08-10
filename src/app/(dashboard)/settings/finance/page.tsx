import { requirePermission } from "@/lib/auth";
import { getCompanySettings, getBankAccounts, getSignatureAssets } from "@/lib/queries/finance-settings";
import { CompanySettingsForm } from "@/components/finance/company-settings-form";
import { BankAccountsPanel } from "@/components/finance/bank-accounts-panel";
import { SignatureAssetsPanel } from "@/components/finance/signature-assets-panel";
import { Card } from "@/components/ui/card";
import { Eyebrow, H1, Muted } from "@/components/ui/typography";

export const metadata = { title: "Settings / Masters · Ratneswar ERP" };
export const dynamic = "force-dynamic";

export default async function FinanceSettingsPage() {
  await requirePermission("settings", "view");
  const [company, bankAccounts, signatures] = await Promise.all([getCompanySettings(), getBankAccounts(), getSignatureAssets()]);
  return <div className="mx-auto flex max-w-[1100px] flex-col gap-6 px-4 py-6 md:px-8">
    <div><Eyebrow>Settings / Masters</Eyebrow><H1 className="text-2xl md:text-3xl">Company, Documents & AI</H1><Muted className="mt-1">Central settings used across Ratneswar ERP. Sensitive document values stay editable and controlled.</Muted></div>
    <Card className="p-6"><CompanySettingsForm company={company as any} /></Card>
    <Card className="p-6"><SignatureAssetsPanel assets={signatures as any} /></Card>
    <Card className="p-6"><h2 className="mb-4 text-sm font-semibold">Bank Accounts</h2><BankAccountsPanel accounts={bankAccounts} /></Card>
  </div>;
}
