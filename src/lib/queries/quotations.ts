import "server-only";
import { prisma } from "@/lib/prisma";
import { documentNumberPreview } from "@/lib/document-number";
import { resolveStoredFileUrl } from "@/lib/supabase/storage-server";

export async function getQuotations() {
  const quotations = await prisma.quotation.findMany({
    orderBy: { date: "desc" },
    include: {
      site: { select: { name: true } },
      clientAccount: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true, role: true } },
      approvedBy: { select: { id: true, name: true } },
      signatureAsset: true,
    },
  });
  return quotations.map((q) => ({
    ...q,
    taxableValue: Number(q.taxableValue), taxAmount: Number(q.taxAmount), amount: Number(q.amount),
  }));
}

export async function getQuotationDetail(id: string) {
  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: {
      items: true,
      site: { select: { name: true } },
      clientAccount: true,
      bankAccount: true,
      createdBy: { select: { id: true, name: true, role: true } },
      approvedBy: { select: { id: true, name: true, role: true } },
      signatureAsset: true,
    },
  });
  if (!quotation) return null;
  const signaturePreviewUrl = quotation.signatureAsset?.imageUrl ? await resolveStoredFileUrl(quotation.signatureAsset.imageUrl) : null;

  return {
    ...quotation,
    signaturePreviewUrl,
    taxableValue: Number(quotation.taxableValue), taxAmount: Number(quotation.taxAmount), amount: Number(quotation.amount),
    items: quotation.items.map((it) => ({
      ...it,
      quantity: Number(it.quantity),
      secondaryQuantity: it.secondaryQuantity == null ? null : Number(it.secondaryQuantity),
      rate: Number(it.rate), amount: Number(it.amount),
    })),
  };
}

export async function suggestNextQuoteNumber(): Promise<string> { return documentNumberPreview("QUOTATION"); }
export type QuotationDetail = NonNullable<Awaited<ReturnType<typeof getQuotationDetail>>>;
export type QuotationListItem = Awaited<ReturnType<typeof getQuotations>>[number];

export async function getQuotationMasterOptions() {
  return prisma.client.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
}
