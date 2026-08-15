import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { getQuotationDetail } from "@/lib/queries/quotations";
import { getCompanySettings } from "@/lib/queries/finance-settings";
import { getEntityHistory } from "@/lib/queries/history";
import { QuotationDetailClient } from "@/components/finance/quotation-detail-client";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quotation = await getQuotationDetail(id);
  return { title: quotation ? `${quotation.referenceNo} · Ratneswar ERP` : "Quotation · Ratneswar ERP" };
}

export default async function QuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePermission("quotations", "view");
  const [quotation, company, history] = await Promise.all([
    getQuotationDetail(id), getCompanySettings(), getEntityHistory("Quotation", id),
  ]);
  if (!quotation) notFound();
  return <QuotationDetailClient quotation={quotation} company={company} history={history} userRole={user.role} userId={user.id} />;
}
