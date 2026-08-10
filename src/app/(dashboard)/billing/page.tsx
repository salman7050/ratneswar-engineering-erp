import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { getBillingCenterData } from "@/lib/queries/billing";
import { BillingCenter } from "@/components/billing/billing-center";
import { Eyebrow, H1, Muted } from "@/components/ui/typography";

export const metadata = { title: "Monthly Billing · Ratneswar ERP" };
export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const user = await requirePermission("billing", "view");
  const data = await getBillingCenterData();
  const capabilities = {
    create: can(user.role, "billing", "create"),
    edit: can(user.role, "billing", "edit"),
  };
  return (
    <div className="mx-auto flex max-w-[1500px] flex-col gap-6 px-4 py-6 md:px-8">
      <div>
        <Eyebrow>Automated Commercial Billing</Eyebrow>
        <H1 className="text-2xl md:text-3xl">Monthly Site Billing</H1>
        <Muted className="mt-1">Configure each site manually as direct or subcontract work, choose the exact billing party, and generate recurring invoices from editable site-wise templates.</Muted>
      </div>
      <BillingCenter data={data} capabilities={capabilities} />
    </div>
  );
}
