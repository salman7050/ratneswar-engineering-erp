"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authorize, ok, fail, zodError } from "@/lib/actions/action-utils";
import { generateDocumentNumber } from "@/lib/document-number";

const MODULE = "purchase_orders" as const;
const LIST_PATH = "/purchase-orders";

function detailPath(id: string) {
  return `/purchase-orders/${id}`;
}

const itemSchema = z.object({
  itemCode: z.string().max(60).optional().nullable(),
  description: z.string().min(1, "Description required"),
  hsnCode: z.string().min(1, "HSN/SAC required"),
  unit: z.string().min(1).max(20).default("Nos"),
  quantity: z.coerce.number().positive(),
  rate: z.coerce.number().nonnegative(),
  discountPercent: z.coerce.number().min(0).max(100).default(0),
  gstPercent: z.coerce.number().min(0).max(100).default(18),
  remarks: z.string().max(500).optional().nullable(),
});

const poSchema = z.object({
  date: z.coerce.date(),
  refNumber: z.string().max(100).optional().nullable(),
  quotationRef: z.string().max(100).optional().nullable(),
  indentRef: z.string().max(100).optional().nullable(),
  department: z.string().max(100).optional().nullable(),
  raisedBy: z.string().max(100).optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  projectName: z.string().max(200).optional().nullable(),

  vendorId: z.string().optional().nullable(),
  vendorName: z.string().min(1, "Vendor name required"),
  vendorCode: z.string().max(50).optional().nullable(),
  vendorGstin: z.string().max(20).optional().nullable(),
  vendorPan: z.string().max(15).optional().nullable(),
  vendorAddress: z.string().max(500).optional().nullable(),
  vendorEmail: z.string().max(150).optional().nullable(),
  vendorPhone: z.string().max(30).optional().nullable(),
  vendorContactPerson: z.string().max(150).optional().nullable(),

  siteId: z.string().optional().nullable(),
  deliveryAddress: z.string().max(500).optional().nullable(),
  deliveryContactPerson: z.string().max(150).optional().nullable(),
  deliveryDate: z.coerce.date().optional().nullable(),
  expectedDelivery: z.coerce.date().optional().nullable(),

  gstType: z.enum(["SGST_CGST", "IGST"]).default("SGST_CGST"),

  advancePercent: z.coerce.number().min(0).max(100).optional().nullable(),
  creditDays: z.coerce.number().int().min(0).optional().nullable(),
  paymentMethod: z.string().max(100).optional().nullable(),
  bankAccountId: z.string().optional().nullable(),

  deliverySchedule: z.string().max(500).optional().nullable(),
  packing: z.string().max(500).optional().nullable(),
  transportation: z.string().max(500).optional().nullable(),
  insurance: z.string().max(500).optional().nullable(),
  warranty: z.string().max(500).optional().nullable(),
  inspectionTerms: z.string().max(500).optional().nullable(),

  specialInstructions: z.string().max(2000).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  terms: z.string().max(4000).optional().nullable(),
  includeSignature: z.boolean().default(false),
  signatureAssetId: z.string().optional().nullable(),

  items: z.array(itemSchema).min(1, "Add at least one line item"),
});

function cleanEmpty<T extends Record<string, unknown>>(data: T): T {
  const out = { ...data };
  for (const k of Object.keys(out)) if (out[k] === "") (out as Record<string, unknown>)[k] = null;
  return out;
}

/** Per-item + PO-level totals. Discount and GST are computed per line, then summed —
 * this is the only way the printed item table and the header GST split reconcile. */
function computeTotals(items: z.infer<typeof itemSchema>[]) {
  let subtotal = 0;
  let discountTotal = 0;
  let gstTotal = 0;

  const computed = items.map((it) => {
    const lineGross = Math.round(it.quantity * it.rate * 100) / 100;
    const lineDiscount = Math.round(((lineGross * it.discountPercent) / 100) * 100) / 100;
    const lineTaxable = Math.round((lineGross - lineDiscount) * 100) / 100;
    const lineGst = Math.round(((lineTaxable * it.gstPercent) / 100) * 100) / 100;
    const lineTotal = Math.round((lineTaxable + lineGst) * 100) / 100;

    subtotal += lineGross;
    discountTotal += lineDiscount;
    gstTotal += lineGst;

    return { ...it, amount: lineTotal, gstAmount: lineGst };
  });

  subtotal = Math.round(subtotal * 100) / 100;
  discountTotal = Math.round(discountTotal * 100) / 100;
  gstTotal = Math.round(gstTotal * 100) / 100;
  const taxableValue = Math.round((subtotal - discountTotal) * 100) / 100;
  const exactTotal = taxableValue + gstTotal;
  const grandTotal = Math.round(exactTotal);
  const roundOff = Math.round((grandTotal - exactTotal) * 100) / 100;

  return { computed, subtotal, discountTotal, gstTotal, taxableValue, roundOff, grandTotal };
}

async function logActivity(action: string, poId: string, userId: string, metadata?: Record<string, unknown>) {
  await prisma.auditLog.create({ data: { action, entityType: "PurchaseOrder", entityId: poId, userId, metadata } });
}

export async function createPurchaseOrder(input: z.infer<typeof poSchema>) {
  const { user, error } = await authorize(MODULE, "create");
  if (!user) return error;
  const parsed = poSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const { items, gstType, ...rest } = parsed.data;
  const { computed, subtotal, discountTotal, gstTotal, taxableValue, roundOff, grandTotal } = computeTotals(items);

  const cgstAmount = gstType === "SGST_CGST" ? Math.round((gstTotal / 2) * 100) / 100 : 0;
  const sgstAmount = gstType === "SGST_CGST" ? gstTotal - cgstAmount : 0;
  const igstAmount = gstType === "IGST" ? gstTotal : 0;

  const poNo = await generateDocumentNumber("PURCHASE_ORDER", parsed.data.date);

  const po = await prisma.purchaseOrder.create({
    data: {
      ...cleanEmpty(rest),
      poNo,
      gstType,
      subtotal,
      discountAmount: discountTotal,
      taxableValue,
      cgstAmount,
      sgstAmount,
      igstAmount,
      taxAmount: gstTotal,
      roundOff,
      grandTotal,
      createdById: user.id,
      items: {
        create: computed.map((it, i) => ({ ...it, sortOrder: i })),
      },
    },
  });

  await logActivity("PO_CREATED", po.id, user.id, { poNo: po.poNo });
  revalidatePath(LIST_PATH);
  return ok(po);
}

export async function updatePurchaseOrder(id: string, input: z.infer<typeof poSchema>) {
  const { user, error } = await authorize(MODULE, "edit");
  if (!user) return error;

  const existing = await prisma.purchaseOrder.findUnique({ where: { id }, select: { status: true } });
  if (!existing) return fail("Purchase order not found.");
  if (existing.status !== "DRAFT") return fail("Only draft purchase orders can be edited — duplicate it instead.");

  const parsed = poSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const { items, gstType, ...rest } = parsed.data;
  const { computed, subtotal, discountTotal, gstTotal, taxableValue, roundOff, grandTotal } = computeTotals(items);

  const cgstAmount = gstType === "SGST_CGST" ? Math.round((gstTotal / 2) * 100) / 100 : 0;
  const sgstAmount = gstType === "SGST_CGST" ? gstTotal - cgstAmount : 0;
  const igstAmount = gstType === "IGST" ? gstTotal : 0;

  const po = await prisma.$transaction(async (tx) => {
    await tx.purchaseOrderItem.deleteMany({ where: { poId: id } });
    return tx.purchaseOrder.update({
      where: { id },
      data: {
        ...cleanEmpty(rest),
        gstType,
        subtotal,
        discountAmount: discountTotal,
        taxableValue,
        cgstAmount,
        sgstAmount,
        igstAmount,
        taxAmount: gstTotal,
        roundOff,
        grandTotal,
        items: { create: computed.map((it, i) => ({ ...it, sortOrder: i })) },
      },
    });
  });

  await logActivity("PO_UPDATED", id, user.id);
  revalidatePath(LIST_PATH);
  revalidatePath(detailPath(id));
  return ok(po);
}

export async function deletePurchaseOrder(id: string) {
  const { user, error } = await authorize(MODULE, "delete");
  if (!user) return error;

  const existing = await prisma.purchaseOrder.findUnique({ where: { id }, select: { status: true } });
  if (!existing) return fail("Purchase order not found.");
  if (existing.status !== "DRAFT") return fail("Only draft purchase orders can be deleted — cancel it instead.");

  await prisma.purchaseOrder.delete({ where: { id } });
  revalidatePath(LIST_PATH);
  return ok(undefined);
}

export async function duplicatePurchaseOrder(id: string) {
  const { user, error } = await authorize(MODULE, "create");
  if (!user) return error;

  const source = await prisma.purchaseOrder.findUnique({ where: { id }, include: { items: true } });
  if (!source) return fail("Purchase order not found.");

  const poNo = await generateDocumentNumber("PURCHASE_ORDER");
  const clone = await prisma.purchaseOrder.create({
    data: {
      poNo,
      date: new Date(),
      refNumber: source.refNumber,
      quotationRef: source.quotationRef,
      indentRef: source.indentRef,
      department: source.department,
      raisedBy: source.raisedBy,
      priority: source.priority,
      projectName: source.projectName,
      vendorId: source.vendorId,
      vendorName: source.vendorName,
      vendorCode: source.vendorCode,
      vendorGstin: source.vendorGstin,
      vendorPan: source.vendorPan,
      vendorAddress: source.vendorAddress,
      vendorEmail: source.vendorEmail,
      vendorPhone: source.vendorPhone,
      vendorContactPerson: source.vendorContactPerson,
      siteId: source.siteId,
      deliveryAddress: source.deliveryAddress,
      deliveryContactPerson: source.deliveryContactPerson,
      gstType: source.gstType,
      subtotal: source.subtotal,
      discountAmount: source.discountAmount,
      taxableValue: source.taxableValue,
      cgstAmount: source.cgstAmount,
      sgstAmount: source.sgstAmount,
      igstAmount: source.igstAmount,
      taxAmount: source.taxAmount,
      roundOff: source.roundOff,
      grandTotal: source.grandTotal,
      advancePercent: source.advancePercent,
      creditDays: source.creditDays,
      paymentMethod: source.paymentMethod,
      bankAccountId: source.bankAccountId,
      deliverySchedule: source.deliverySchedule,
      packing: source.packing,
      transportation: source.transportation,
      insurance: source.insurance,
      warranty: source.warranty,
      inspectionTerms: source.inspectionTerms,
      specialInstructions: source.specialInstructions,
      notes: source.notes,
      terms: source.terms,
      includeSignature: source.includeSignature,
      signatureAssetId: source.signatureAssetId,
      createdById: user.id,
      items: {
        create: source.items.map((it) => ({
          sortOrder: it.sortOrder,
          itemCode: it.itemCode,
          description: it.description,
          hsnCode: it.hsnCode,
          unit: it.unit,
          quantity: it.quantity,
          rate: it.rate,
          discountPercent: it.discountPercent,
          gstPercent: it.gstPercent,
          gstAmount: it.gstAmount,
          amount: it.amount,
          remarks: it.remarks,
        })),
      },
    },
  });

  await logActivity("PO_DUPLICATED", clone.id, user.id, { sourcePoNo: source.poNo });
  revalidatePath(LIST_PATH);
  return ok(clone);
}

export async function submitForApproval(id: string) {
  const { user, error } = await authorize(MODULE, "edit");
  if (!user) return error;

  const existing = await prisma.purchaseOrder.findUnique({ where: { id }, select: { status: true } });
  if (!existing) return fail("Purchase order not found.");
  if (existing.status !== "DRAFT") return fail("Only draft purchase orders can be submitted for approval.");

  const po = await prisma.purchaseOrder.update({
    where: { id },
    data: { status: "PENDING_APPROVAL", approvalStage: "OWNER" },
  });
  await logActivity("PO_SUBMITTED_FOR_APPROVAL", id, user.id);
  revalidatePath(LIST_PATH);
  revalidatePath(detailPath(id));
  return ok(po);
}

const STAGE_ORDER = ["OWNER"] as const;
const STAGE_ROLE: Record<(typeof STAGE_ORDER)[number], string[]> = { OWNER: ["OWNER"] };

const approveSchema = z.object({ id: z.string(), comment: z.string().max(1000).optional().nullable() });

export async function approveCurrentStage(input: z.infer<typeof approveSchema>) {
  const { user, error } = await authorize(MODULE, "approve");
  if (!user) return error;
  const parsed = approveSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const po = await prisma.purchaseOrder.findUnique({ where: { id: parsed.data.id }, select: { status: true, approvalStage: true } });
  if (!po) return fail("Purchase order not found.");
  if (po.status !== "PENDING_APPROVAL") return fail("This purchase order isn't waiting for approval.");
  if (po.approvalStage === "NONE" || po.approvalStage === "DONE") return fail("Nothing to approve at this stage.");

  const stage = po.approvalStage as (typeof STAGE_ORDER)[number];
  if (!STAGE_ROLE[stage].includes(user.role)) {
    return fail(`Only ${STAGE_ROLE[stage].join("/")} can approve the ${stage.toLowerCase()} stage.`);
  }

  const currentIndex = STAGE_ORDER.indexOf(stage);
  const nextStage = currentIndex + 1 < STAGE_ORDER.length ? STAGE_ORDER[currentIndex + 1] : "DONE";
  const isFinal = nextStage === "DONE";

  const updated = await prisma.$transaction(async (tx) => {
    await tx.pOApproval.create({
      data: { poId: parsed.data.id, stage, action: "APPROVED", comment: parsed.data.comment, byId: user.id },
    });
    return tx.purchaseOrder.update({
      where: { id: parsed.data.id },
      data: { approvalStage: nextStage, status: isFinal ? "APPROVED" : "PENDING_APPROVAL" },
    });
  });

  await logActivity(isFinal ? "PO_APPROVED_FINAL" : `PO_APPROVED_${stage}`, parsed.data.id, user.id);
  revalidatePath(LIST_PATH);
  revalidatePath(detailPath(parsed.data.id));
  return ok(updated);
}

const rejectSchema = z.object({ id: z.string(), reason: z.string().min(1, "Reason is required").max(1000) });

export async function rejectPurchaseOrder(input: z.infer<typeof rejectSchema>) {
  const { user, error } = await authorize(MODULE, "approve");
  if (!user) return error;
  const parsed = rejectSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const po = await prisma.purchaseOrder.findUnique({ where: { id: parsed.data.id }, select: { status: true, approvalStage: true } });
  if (!po) return fail("Purchase order not found.");
  if (po.status !== "PENDING_APPROVAL") return fail("This purchase order isn't waiting for approval.");

  const stage = po.approvalStage === "NONE" || po.approvalStage === "DONE" ? "OWNER" : (po.approvalStage as (typeof STAGE_ORDER)[number]);
  if (!STAGE_ROLE[stage].includes(user.role)) {
    return fail(`Only ${STAGE_ROLE[stage].join("/")} can act at this stage.`);
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.pOApproval.create({
      data: { poId: parsed.data.id, stage, action: "REJECTED", comment: parsed.data.reason, byId: user.id },
    });
    return tx.purchaseOrder.update({
      where: { id: parsed.data.id },
      data: { status: "REJECTED", rejectedReason: parsed.data.reason },
    });
  });

  await logActivity("PO_REJECTED", parsed.data.id, user.id, { reason: parsed.data.reason });
  revalidatePath(LIST_PATH);
  revalidatePath(detailPath(parsed.data.id));
  return ok(updated);
}

/** Send an approved PO back to draft for edits — restarts the approval chain from scratch. */
export async function reopenAsDraft(id: string) {
  const { user, error } = await authorize(MODULE, "edit");
  if (!user) return error;

  const po = await prisma.purchaseOrder.update({
    where: { id },
    data: { status: "DRAFT", approvalStage: "NONE", rejectedReason: null },
  });
  await logActivity("PO_REOPENED_AS_DRAFT", id, user.id);
  revalidatePath(LIST_PATH);
  revalidatePath(detailPath(id));
  return ok(po);
}

const STATUS_TRANSITIONS: Record<string, string[]> = {
  APPROVED: ["ISSUED", "CANCELLED"],
  ISSUED: ["PARTIALLY_RECEIVED", "COMPLETED", "CANCELLED"],
  PARTIALLY_RECEIVED: ["COMPLETED", "CANCELLED"],
  DRAFT: ["CANCELLED"],
  PENDING_APPROVAL: ["CANCELLED"],
};

const statusSchema = z.object({
  id: z.string(),
  status: z.enum(["ISSUED", "PARTIALLY_RECEIVED", "COMPLETED", "CANCELLED"]),
});

export async function updatePurchaseOrderStatus(input: z.infer<typeof statusSchema>) {
  const { user, error } = await authorize(MODULE, "edit");
  if (!user) return error;
  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const existing = await prisma.purchaseOrder.findUnique({ where: { id: parsed.data.id }, select: { status: true } });
  if (!existing) return fail("Purchase order not found.");

  const allowed = STATUS_TRANSITIONS[existing.status] ?? [];
  if (!allowed.includes(parsed.data.status)) {
    return fail(`Can't move a ${existing.status.replace(/_/g, " ").toLowerCase()} PO to ${parsed.data.status.replace(/_/g, " ").toLowerCase()}.`);
  }

  const po = await prisma.purchaseOrder.update({ where: { id: parsed.data.id }, data: { status: parsed.data.status } });
  await logActivity(`PO_STATUS_${parsed.data.status}`, parsed.data.id, user.id);
  revalidatePath(LIST_PATH);
  revalidatePath(detailPath(parsed.data.id));
  return ok(po);
}

const commentSchema = z.object({ poId: z.string(), content: z.string().min(1).max(1000) });

export async function addPOComment(input: z.infer<typeof commentSchema>) {
  const { user, error } = await authorize(MODULE, "view"); // anyone who can see the PO can discuss it
  if (!user) return error;
  const parsed = commentSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const comment = await prisma.pOComment.create({
    data: { poId: parsed.data.poId, content: parsed.data.content, userId: user.id },
  });
  revalidatePath(detailPath(parsed.data.poId));
  return ok(comment);
}
