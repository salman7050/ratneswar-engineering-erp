import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { getWorkOrderDetail, suggestNextWONumber } from "@/lib/queries/work-orders";
import { getSites } from "@/lib/queries/sites";
import { getCompanySettings } from "@/lib/queries/finance-settings";
import { getEntityHistory } from "@/lib/queries/history";
import { WorkOrderDetailClient } from "@/components/finance/work-order-detail-client";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const wo = await getWorkOrderDetail(params.id);
  return { title: wo ? `${wo.woNo} · Ratneswar ERP` : "Work Order · Ratneswar ERP" };
}

export default async function WorkOrderDetailPage({ params }: { params: { id: string } }) {
  await requirePermission("invoices", "view");
  const [wo, sites, company, history, suggestedNo] = await Promise.all([
    getWorkOrderDetail(params.id), getSites(), getCompanySettings(),
    getEntityHistory("WorkOrder", params.id), suggestNextWONumber(),
  ]);

  if (!wo) notFound();

  return <WorkOrderDetailClient wo={wo} company={company} history={history} sites={sites} suggestedNo={suggestedNo} />;
}
