import "server-only";
import { prisma } from "@/lib/prisma";
import { documentNumberPreview } from "@/lib/document-number";
import { resolveStoredFileUrl } from "@/lib/supabase/storage-server";

export async function getInvoices() {
  await prisma.invoice.updateMany({
    where: { status: "GENERATED", dueDate: { lt: new Date() } },
    data: { status: "OVERDUE" },
  });
  const invoices = await prisma.invoice.findMany({
    orderBy: { date: "desc" },
    include: {
      site: { select: { name: true, siteCode: true, ownership: true } },
      clientAccount: { select: { name: true } },
      subcontractor: { select: { name: true } },
      payments: { select: { amount: true } },
    },
  });
  return invoices.map((invoice) => ({
    ...invoice,
    taxableValue: Number(invoice.taxableValue),
    taxAmount: Number(invoice.taxAmount),
    grandTotal: Number(invoice.grandTotal),
    amountPaid: invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0),
  }));
}

export async function getInvoiceDetail(id: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
      payments: { orderBy: { date: "desc" } },
      site: { include: { clientAccount: true, subcontractor: true } },
      clientAccount: true,
      subcontractor: true,
      signatureAsset: true,
      billingContract: true,
      bankAccount: true,
    },
  });
  if (!invoice) return null;
  const signaturePreviewUrl = invoice.signatureAsset?.imageUrl ? await resolveStoredFileUrl(invoice.signatureAsset.imageUrl) : null;

  return {
    ...invoice,
    signaturePreviewUrl,
    taxableValue: Number(invoice.taxableValue),
    taxAmount: Number(invoice.taxAmount),
    grandTotal: Number(invoice.grandTotal),
    items: invoice.items.map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      rate: Number(item.rate),
      gstPercent: Number(item.gstPercent),
      taxAmount: Number(item.taxAmount),
      amount: Number(item.amount),
    })),
    payments: invoice.payments.map((payment) => ({ ...payment, amount: Number(payment.amount) })),
  };
}

export async function suggestNextInvoiceNumber(): Promise<string> {
  return documentNumberPreview("INVOICE");
}

export type InvoiceDetail = NonNullable<Awaited<ReturnType<typeof getInvoiceDetail>>>;
export type InvoiceListItem = Awaited<ReturnType<typeof getInvoices>>[number];

export async function getInvoiceMasterOptions() {
  const [clients, subcontractors] = await Promise.all([
    prisma.client.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.subcontractor.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);
  return { clients, subcontractors };
}
