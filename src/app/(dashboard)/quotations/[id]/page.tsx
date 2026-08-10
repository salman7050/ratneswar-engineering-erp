import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { getQuotationDetail } from "@/lib/queries/quotations";
import { getCompanySettings } from "@/lib/queries/finance-settings";
import { getEntityHistory } from "@/lib/queries/history";
import { QuotationDetailClient } from "@/components/finance/quotation-detail-client";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const quotation = await getQuotationDetail(params.id);
  return { title: quotation ? `${quotation.referenceNo} · Ratneswar ERP` : "Quotation · Ratneswar ERP" };
}

export default async function QuotationDetailPage({ params }: { params: { id: string } }) {
  const user = await requirePermission("quotations", "view");
  const [quotation, company, history] = await Promise.all([
    getQuotationDetail(params.id), getCompanySettings(), getEntityHistory("Quotation", params.id),
  ]);
  if (!quotation) notFound();
  return <QuotationDetailClient quotation={quotation} company={company} history={history} userRole={user.role} userId={user.id} />;
}
