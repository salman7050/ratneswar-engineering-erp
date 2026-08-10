"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authorize, ok, fail, zodError } from "@/lib/actions/action-utils";
import { generateDocumentNumber } from "@/lib/document-number";

const itemSchema = z.object({
  workCategory: z.enum(["O_AND_M", "MAINTENANCE", "TESTING", "INSTALLATION", "MATERIAL", "OTHER"]).default("OTHER"),
  description: z.string().min(1),
  testingDescription: z.string().max(1200).optional().nullable(),
  hsnCode: z.string().min(1),
  unit: z.string().min(1).default("Nos"),
  quantity: z.coerce.number().positive(),
  rate: z.coerce.number().nonnegative(),
  gstPercent: z.coerce.number().min(0).max(100).default(18),
});

const invoiceSchema = z.object({
  date: z.coerce.date(),
  dueDate: z.coerce.date().optional().nullable(),
  invoiceType: z.enum(["STANDARD", "MONTHLY_SITE", "SUBCONTRACT"]).default("STANDARD"),
  billingMonth: z.string().regex(/^\d{4}-\d{2}$/).optional().nullable().or(z.literal("")),
  periodFrom: z.coerce.date().optional().nullable(),
  periodTo: z.coerce.date().optional().nullable(),
  buyerName: z.string().min(1),
  buyerAddress: z.string().optional().nullable(),
  buyerGstin: z.string().optional().nullable(),
  buyerPan: z.string().optional().nullable(),
  placeOfSupply: z.string().optional().nullable(),
  referenceNo: z.string().optional().nullable(),
  referenceDate: z.coerce.date().optional().nullable(),
  poRefNo: z.string().optional().nullable(),
  buyerOrderDate: z.coerce.date().optional().nullable(),
  destination: z.string().optional().nullable(),
  tenderNo: z.string().optional().nullable(),
  dispatchThrough: z.string().optional().nullable(),
  paymentTerms: z.string().optional().nullable(),
  termsOfDelivery: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
  gstType: z.enum(["SGST_CGST", "IGST"]),
  siteId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  subcontractorId: z.string().optional().nullable(),
  billingContractId: z.string().optional().nullable(),
  tenderId: z.string().optional().nullable(),
  bankAccountId: z.string().optional().nullable(),
  includeSignature: z.boolean().default(false),
  signatureAssetId: z.string().optional().nullable(),
  items: z.array(itemSchema).min(1, "Add at least one line item"),
});

function cleanEmpty<T extends Record<string, unknown>>(data: T): T {
  const out = { ...data };
  for (const key of Object.keys(out)) if (out[key] === "") (out as Record<string, unknown>)[key] = null;
  return out;
}

function computeItems(items: z.infer<typeof itemSchema>[]) {
  const computed = items.map((item, sortOrder) => {
    const amount = Math.round(item.quantity * item.rate * 100) / 100;
    const taxAmount = Math.round(amount * item.gstPercent) / 100;
    return { ...item, sortOrder, amount, taxAmount };
  });
  const taxableValue = Math.round(computed.reduce((sum, item) => sum + item.amount, 0) * 100) / 100;
  const taxAmount = Math.round(computed.reduce((sum, item) => sum + item.taxAmount, 0) * 100) / 100;
  const grandTotal = Math.round((taxableValue + taxAmount) * 100) / 100;
  return { computed, taxableValue, taxAmount, grandTotal };
}

export async function createInvoice(input: z.infer<typeof invoiceSchema>) {
  const { user, error } = await authorize("invoices", "create");
  if (!user) return error;
  const parsed = invoiceSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const { items, ...rest } = parsed.data;
  const totals = computeItems(items);
  const invoice = await prisma.$transaction(async (tx) => {
    const invoiceNo = await generateDocumentNumber("INVOICE", rest.date, tx);
    return tx.invoice.create({
      data: {
        ...cleanEmpty(rest),
        invoiceNo,
        taxableValue: totals.taxableValue,
        taxAmount: totals.taxAmount,
        grandTotal: totals.grandTotal,
        createdById: user.id,
        items: { create: totals.computed },
      },
    });
  });

  await prisma.auditLog.create({ data: { action: "INVOICE_GENERATED", entityType: "Invoice", entityId: invoice.id, userId: user.id, metadata: { invoiceNo: invoice.invoiceNo, invoiceType: invoice.invoiceType } } });
  revalidatePath("/invoices");
  revalidatePath("/billing");
  return ok(invoice);
}

export async function updateInvoice(id: string, input: z.infer<typeof invoiceSchema>) {
  const { user, error } = await authorize("invoices", "edit");
  if (!user) return error;
  const parsed = invoiceSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const { items, ...rest } = parsed.data;
  const totals = computeItems(items);
  const invoice = await prisma.$transaction(async (tx) => {
    await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
    return tx.invoice.update({
      where: { id },
      data: {
        ...cleanEmpty(rest),
        taxableValue: totals.taxableValue,
        taxAmount: totals.taxAmount,
        grandTotal: totals.grandTotal,
        items: { create: totals.computed },
      },
    });
  });

  await prisma.auditLog.create({ data: { action: "INVOICE_UPDATED", entityType: "Invoice", entityId: id, userId: user.id } });
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
  revalidatePath("/billing");
  return ok(invoice);
}

export async function deleteInvoice(id: string) {
  const { user, error } = await authorize("invoices", "delete");
  if (!user) return error;
  await prisma.invoice.delete({ where: { id } });
  await prisma.auditLog.create({ data: { action: "INVOICE_DELETED", entityType: "Invoice", entityId: id, userId: user.id } });
  revalidatePath("/invoices");
  revalidatePath("/billing");
  return ok(undefined);
}

export async function updateInvoiceStatus(id: string, status: "DRAFT" | "GENERATED" | "PAID" | "OVERDUE") {
  const { user, error } = await authorize("invoices", "edit");
  if (!user) return error;
  const invoice = await prisma.invoice.update({ where: { id }, data: { status } });
  revalidatePath(`/invoices/${id}`);
  revalidatePath("/invoices");
  return ok(invoice);
}

const paymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.coerce.number().positive(),
  date: z.coerce.date(),
  mode: z.string().min(1),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function recordPayment(input: z.infer<typeof paymentSchema>) {
  const { user, error } = await authorize("invoices", "edit");
  if (!user) return error;
  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);
  const invoice = await prisma.invoice.findUnique({ where: { id: parsed.data.invoiceId }, include: { payments: true } });
  if (!invoice) return fail("Invoice not found.");

  const record = await prisma.$transaction(async (tx) => {
    const payment = await tx.paymentRecord.create({ data: parsed.data });
    const totalPaid = invoice.payments.reduce((sum, entry) => sum + Number(entry.amount), 0) + parsed.data.amount;
    if (totalPaid >= Number(invoice.grandTotal)) await tx.invoice.update({ where: { id: invoice.id }, data: { status: "PAID" } });
    return payment;
  });
  revalidatePath(`/invoices/${parsed.data.invoiceId}`);
  revalidatePath("/invoices");
  return ok(record);
}

export async function deletePayment(id: string, invoiceId: string) {
  const { user, error } = await authorize("invoices", "edit");
  if (!user) return error;
  await prisma.$transaction(async (tx) => {
    await tx.paymentRecord.delete({ where: { id } });
    const invoice = await tx.invoice.findUnique({ where: { id: invoiceId }, include: { payments: true } });
    if (invoice) {
      const paid = invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
      const nextStatus = paid >= Number(invoice.grandTotal) ? "PAID" : invoice.dueDate && invoice.dueDate < new Date() ? "OVERDUE" : "GENERATED";
      await tx.invoice.update({ where: { id: invoiceId }, data: { status: nextStatus } });
    }
  });
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/invoices");
  return ok(undefined);
}
