"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authorize, ok, fail, zodError } from "@/lib/actions/action-utils";
import { computeGstTotals } from "@/lib/finance/gst";
import { financialYear, generateDocumentNumber } from "@/lib/document-number";

const itemSchema = z.object({
  shortDescription: z.string().trim().max(500).optional().nullable(),
  description: z.string().trim().min(1),
  hsnCode: z.string().trim().max(30).optional().default(""),
  quantity: z.coerce.number().nonnegative(),
  unit: z.string().trim().min(1).max(40).default("Nos"),
  secondaryQuantity: z.coerce.number().nonnegative().optional().nullable(),
  secondaryUnit: z.string().trim().max(40).optional().nullable(),
  rate: z.coerce.number().nonnegative(),
  rateBasis: z.string().trim().max(80).optional().nullable(),
  calculationMode: z.enum(["QTY_RATE", "QTY_SECONDARY_RATE", "FIXED"]).default("QTY_RATE"),
});

const quotationSchema = z.object({
  date: z.coerce.date(),
  recipientDesignation: z.string().trim().max(200).optional().nullable(),
  recipientDepartment: z.string().trim().max(300).optional().nullable(),
  client: z.string().trim().min(1),
  clientAddress: z.string().trim().optional().nullable(),
  clientGstin: z.string().trim().optional().nullable(),
  clientId: z.string().optional().nullable(),
  subject: z.string().trim().min(5),
  scope: z.string().trim().min(5),
  introduction: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
  terms: z.string().trim().optional().nullable(),
  aiDrafted: z.boolean().default(false),
  riskLevel: z.enum(["NORMAL", "HIGH_RISK"]).default("NORMAL"),
  riskReason: z.string().trim().optional().nullable(),
  gstType: z.enum(["SGST_CGST", "IGST"]),
  validTill: z.coerce.date().optional().nullable(),
  siteId: z.string().optional().nullable(),
  tenderId: z.string().optional().nullable(),
  bankAccountId: z.string().optional().nullable(),
  includeSignature: z.boolean().default(false),
  signatureAssetId: z.string().optional().nullable(),
  items: z.array(itemSchema).min(1, "Add at least one line item"),
});

function cleanEmpty<T extends Record<string, unknown>>(data: T): T {
  const out = { ...data };
  for (const k of Object.keys(out)) if (out[k] === "") (out as Record<string, unknown>)[k] = null;
  return out;
}

function amountForItem(item: z.infer<typeof itemSchema>) {
  if (item.calculationMode === "FIXED") return Math.round(item.rate * 100) / 100;
  if (item.calculationMode === "QTY_SECONDARY_RATE") {
    return Math.round(item.quantity * Number(item.secondaryQuantity || 0) * item.rate * 100) / 100;
  }
  return Math.round(item.quantity * item.rate * 100) / 100;
}

async function approvalState(riskLevel: "NORMAL" | "HIGH_RISK", total: number) {
  const settings = await prisma.companySettings.findUnique({ where: { id: "singleton" }, select: { ownerApprovalThreshold: true } });
  const threshold = Number(settings?.ownerApprovalThreshold ?? 0);
  const thresholdTriggered = threshold > 0 && total >= threshold;
  const required = riskLevel === "HIGH_RISK" || thresholdTriggered;
  return {
    approvalStatus: required ? ("PENDING" as const) : ("NOT_REQUIRED" as const),
    approvalRequestedAt: required ? new Date() : null,
    thresholdTriggered,
  };
}

export async function createQuotation(input: z.infer<typeof quotationSchema>) {
  const { user, error } = await authorize("quotations", "create");
  if (!user) return error;
  const parsed = quotationSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const { items, ...rest } = parsed.data;
  const itemsWithAmount = items.map((it) => ({ ...it, amount: amountForItem(it) }));
  const totals = computeGstTotals(itemsWithAmount, rest.gstType);
  const approval = await approvalState(rest.riskLevel, totals.grandTotal);

  const company = await prisma.companySettings.findUnique({ where: { id: "singleton" }, select: { quotationRefPrefix: true } });
  const quotation = await prisma.$transaction(async (tx) => {
    const quoteNo = await generateDocumentNumber("QUOTATION", rest.date, tx);
    const referenceNo = `${company?.quotationRefPrefix || "RE/QTN"}/${financialYear(rest.date)}/${quoteNo}`;
    return tx.quotation.create({
      data: {
        ...cleanEmpty(rest),
        quoteNo,
        referenceNo,
        taxableValue: totals.taxableValue,
        taxAmount: totals.taxAmount,
        amount: totals.grandTotal,
        approvalStatus: approval.approvalStatus,
        approvalRequestedAt: approval.approvalRequestedAt,
        createdById: user.id,
        items: { create: itemsWithAmount.map((item) => ({
          shortDescription: item.shortDescription || null, description: item.description, hsnCode: item.hsnCode || "",
          quantity: item.quantity, unit: item.unit || "Nos", secondaryQuantity: item.secondaryQuantity ?? null, secondaryUnit: item.secondaryUnit || null,
          rate: item.rate, rateBasis: item.rateBasis || null, calculationMode: item.calculationMode, amount: item.amount,
        })) },
      },
    });
  });

  await prisma.auditLog.create({
    data: {
      action: approval.approvalStatus === "PENDING" ? "QUOTATION_CREATED_APPROVAL_PENDING" : "QUOTATION_CREATED",
      entityType: "Quotation",
      entityId: quotation.id,
      userId: user.id,
      metadata: { quoteNo: quotation.quoteNo, riskLevel: rest.riskLevel, total: totals.grandTotal, thresholdTriggered: approval.thresholdTriggered },
    },
  });
  revalidatePath("/quotations");
  return ok(quotation);
}

export async function updateQuotation(id: string, input: z.infer<typeof quotationSchema>) {
  const { user, error } = await authorize("quotations", "edit");
  if (!user) return error;
  const parsed = quotationSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const { items, ...rest } = parsed.data;
  const itemsWithAmount = items.map((it) => ({ ...it, amount: amountForItem(it) }));
  const totals = computeGstTotals(itemsWithAmount, rest.gstType);
  const approval = await approvalState(rest.riskLevel, totals.grandTotal);

  const quotation = await prisma.$transaction(async (tx) => {
    await tx.quotationItem.deleteMany({ where: { quotationId: id } });
    return tx.quotation.update({
      where: { id },
      data: {
        ...cleanEmpty(rest),
        taxableValue: totals.taxableValue,
        taxAmount: totals.taxAmount,
        amount: totals.grandTotal,
        approvalStatus: approval.approvalStatus,
        approvalRequestedAt: approval.approvalRequestedAt,
        approvedAt: null,
        approvedById: null,
        approvalNote: null,
        items: { create: itemsWithAmount.map((item) => ({
          shortDescription: item.shortDescription || null, description: item.description, hsnCode: item.hsnCode || "",
          quantity: item.quantity, unit: item.unit || "Nos", secondaryQuantity: item.secondaryQuantity ?? null, secondaryUnit: item.secondaryUnit || null,
          rate: item.rate, rateBasis: item.rateBasis || null, calculationMode: item.calculationMode, amount: item.amount,
        })) },
      },
    });
  });

  await prisma.auditLog.create({ data: { action: "QUOTATION_UPDATED", entityType: "Quotation", entityId: id, userId: user.id, metadata: { approvalStatus: approval.approvalStatus } } });
  revalidatePath("/quotations");
  revalidatePath(`/quotations/${id}`);
  return ok(quotation);
}

export async function approveQuotation(id: string, note?: string) {
  const { user, error } = await authorize("quotations", "approve");
  if (!user) return error;
  if (user.role !== "OWNER") return fail("Risk approval must be completed by a Owner account.");
  const current = await prisma.quotation.findUnique({ where: { id }, select: { createdById: true, approvalStatus: true } });
  if (!current) return fail("Quotation not found.");
  if (current.createdById === user.id) return fail("The creator cannot approve the same quotation.");
  if (current.approvalStatus === "NOT_REQUIRED") return fail("This quotation does not require owner approval.");

  const quotation = await prisma.quotation.update({
    where: { id },
    data: { approvalStatus: "APPROVED", approvedAt: new Date(), approvedById: user.id, approvalNote: note?.trim() || null },
  });
  await prisma.auditLog.create({ data: { action: "QUOTATION_APPROVED", entityType: "Quotation", entityId: id, userId: user.id, metadata: { note: note || null } } });
  revalidatePath(`/quotations/${id}`); revalidatePath("/quotations");
  return ok(quotation);
}

export async function rejectQuotationApproval(id: string, note: string) {
  const { user, error } = await authorize("quotations", "approve");
  if (!user) return error;
  if (user.role !== "OWNER") return fail("Risk approval must be completed by a Owner account.");
  if (!note.trim()) return fail("Enter a rejection/revision note.");
  const current = await prisma.quotation.findUnique({ where: { id }, select: { createdById: true } });
  if (!current) return fail("Quotation not found.");
  if (current.createdById === user.id) return fail("The creator cannot review the same quotation.");
  const quotation = await prisma.quotation.update({ where: { id }, data: { approvalStatus: "REJECTED", approvalNote: note.trim(), approvedAt: null, approvedById: user.id } });
  await prisma.auditLog.create({ data: { action: "QUOTATION_APPROVAL_REJECTED", entityType: "Quotation", entityId: id, userId: user.id, metadata: { note } } });
  revalidatePath(`/quotations/${id}`); revalidatePath("/quotations");
  return ok(quotation);
}

export async function deleteQuotation(id: string) {
  const { user, error } = await authorize("quotations", "delete");
  if (!user) return error;
  await prisma.quotation.delete({ where: { id } });
  await prisma.auditLog.create({ data: { action: "QUOTATION_DELETED", entityType: "Quotation", entityId: id, userId: user.id } });
  revalidatePath("/quotations");
  return ok(undefined);
}

export async function updateQuotationStatus(id: string, status: "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED") {
  const { user, error } = await authorize("quotations", "edit");
  if (!user) return error;
  const current = await prisma.quotation.findUnique({ where: { id }, select: { approvalStatus: true } });
  if (!current) return fail("Quotation not found.");
  if ((status === "SENT" || status === "ACCEPTED") && (current.approvalStatus === "PENDING" || current.approvalStatus === "REJECTED")) {
    return fail("Owner approval is required before this quotation can be issued or accepted.");
  }
  const quotation = await prisma.quotation.update({ where: { id }, data: { status } });
  await prisma.auditLog.create({ data: { action: "QUOTATION_STATUS_CHANGED", entityType: "Quotation", entityId: id, userId: user.id, metadata: { status } } });
  revalidatePath(`/quotations/${id}`); revalidatePath("/quotations");
  return ok(quotation);
}

/** Converts an accepted quotation into a draft invoice, carrying over party info, items, and GST type. */
export async function convertQuotationToInvoice(id: string) {
  const { user, error } = await authorize("invoices", "create");
  if (!user) return error;

  const quotation = await prisma.quotation.findUnique({ where: { id }, include: { items: true, clientAccount: true } });
  if (!quotation) return fail("Quotation not found.");
  if (quotation.status !== "ACCEPTED") return fail("Accept the quotation before converting it to an invoice.");
  if (quotation.approvalStatus === "PENDING" || quotation.approvalStatus === "REJECTED") return fail("Owner approval is required before invoicing this quotation.");

  const invoiceNo = await generateDocumentNumber("INVOICE");
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNo, date: new Date(), buyerName: quotation.client, buyerAddress: quotation.clientAddress,
      buyerGstin: quotation.clientGstin || quotation.clientAccount?.gstin, buyerPan: quotation.clientAccount?.pan,
      placeOfSupply: quotation.clientAccount?.state || "Gujarat", paymentTerms: "Within 30 Days",
      gstType: quotation.gstType, taxableValue: quotation.taxableValue, taxAmount: quotation.taxAmount, grandTotal: quotation.amount,
      siteId: quotation.siteId, clientId: quotation.clientId, tenderId: quotation.tenderId, bankAccountId: quotation.bankAccountId,
      createdById: user.id,
      items: { create: quotation.items.map((it) => ({ workCategory: "OTHER", description: it.description, hsnCode: it.hsnCode || "9987", unit: it.unit || "Nos", quantity: it.quantity, rate: it.rate, gstPercent: 18, taxAmount: Math.round(Number(it.amount) * 18) / 100, amount: it.amount })) },
    },
  });

  await prisma.auditLog.create({ data: { action: "QUOTATION_CONVERTED_TO_INVOICE", entityType: "Quotation", entityId: id, userId: user.id, metadata: { invoiceId: invoice.id, invoiceNo: invoice.invoiceNo } } });
  revalidatePath("/invoices");
  return ok(invoice);
}
