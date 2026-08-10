"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorize, fail, ok, zodError } from "@/lib/actions/action-utils";

const expenseSchema = z.object({
  siteId: z.string().optional().nullable(),
  businessUnit: z.string().trim().min(1).default("Ratneswar Engineering"),
  transactionType: z.enum(["EXPENSE", "VENDOR_PAYMENT", "PO_PAYMENT", "ADVANCE", "CASH_EXPENSE", "SALARY", "CASH_LABOUR", "INTERNAL_TRANSFER", "REFUND_RECOVERY"]).default("EXPENSE"),
  category: z.enum(["MATERIAL", "LABOUR", "FUEL", "TRANSPORT", "EQUIPMENT", "MISC"]),
  description: z.string().trim().min(2).max(500),
  amount: z.coerce.number().positive(),
  date: z.coerce.date(),
  payee: z.string().trim().max(200).optional().nullable(),
  paymentMode: z.string().trim().max(100).optional().nullable(),
  bankReference: z.string().trim().max(150).optional().nullable(),
  vendorId: z.string().optional().nullable(),
  purchaseOrderId: z.string().optional().nullable(),
  documentUrl: z.string().max(1000).optional().nullable(),
  documentStatus: z.enum(["NOT_REQUIRED", "DOCUMENT_PENDING", "AVAILABLE", "VERIFIED"]).default("NOT_REQUIRED"),
  source: z.string().trim().max(80).default("ERP"),
});

function refreshExpenseViews(siteId?: string | null) {
  revalidatePath("/expenses");
  revalidatePath("/analytics");
  revalidatePath("/dashboard");
  if (siteId) revalidatePath(`/sites/${siteId}`);
}

export async function createExpense(input: z.input<typeof expenseSchema>) {
  const { user, error } = await authorize("expenses", "create");
  if (!user) return error;
  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  if (parsed.data.siteId) {
    const site = await prisma.site.findUnique({ where: { id: parsed.data.siteId }, select: { id: true } });
    if (!site) return fail("Site not found.");
  }
  if (parsed.data.vendorId) {
    const vendor = await prisma.vendor.findUnique({ where: { id: parsed.data.vendorId }, select: { id: true } });
    if (!vendor) return fail("Vendor not found.");
  }
  if (parsed.data.purchaseOrderId) {
    const po = await prisma.purchaseOrder.findUnique({ where: { id: parsed.data.purchaseOrderId }, select: { id: true } });
    if (!po) return fail("Purchase order not found.");
  }

  const settings = await prisma.companySettings.findUnique({ where: { id: "singleton" }, select: { ownerApprovalThreshold: true } });
  const threshold = Number(settings?.ownerApprovalThreshold ?? 0);
  const isMajor = threshold > 0 && parsed.data.amount >= threshold;

  const expense = await prisma.expense.create({
    data: { ...parsed.data, isMajor, createdById: user.id },
  });

  await prisma.auditLog.create({
    data: {
      action: parsed.data.transactionType === "INTERNAL_TRANSFER" ? "INTERNAL_TRANSFER_RECORDED" : "EXPENSE_PAYMENT_RECORDED",
      entityType: "Expense",
      entityId: expense.id,
      userId: user.id,
      metadata: { siteId: expense.siteId, businessUnit: expense.businessUnit, transactionType: expense.transactionType, amount: Number(expense.amount), isMajor },
    },
  });

  refreshExpenseViews(expense.siteId);
  return ok({ ...expense, amount: Number(expense.amount) });
}

export async function setExpenseApproval(id: string, approved: boolean) {
  const { user, error } = await authorize("expenses", "approve");
  if (!user) return error;
  const current = await prisma.expense.findUnique({ where: { id }, select: { siteId: true } });
  if (!current) return fail("Expense/payment not found.");
  const expense = await prisma.expense.update({ where: { id }, data: { approved } });
  await prisma.auditLog.create({ data: { action: approved ? "EXPENSE_APPROVED" : "EXPENSE_APPROVAL_REVOKED", entityType: "Expense", entityId: id, userId: user.id } });
  refreshExpenseViews(current.siteId);
  return ok({ ...expense, amount: Number(expense.amount) });
}

export async function deleteExpense(id: string) {
  const { user, error } = await authorize("expenses", "delete");
  if (!user) return error;
  const current = await prisma.expense.findUnique({ where: { id }, select: { siteId: true } });
  if (!current) return fail("Expense/payment not found.");
  await prisma.expense.delete({ where: { id } });
  await prisma.auditLog.create({ data: { action: "EXPENSE_DELETED", entityType: "Expense", entityId: id, userId: user.id } });
  refreshExpenseViews(current.siteId);
  return ok(undefined);
}
