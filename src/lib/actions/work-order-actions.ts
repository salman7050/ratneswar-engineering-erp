"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { generateDocumentNumber } from "@/lib/document-number";
import { authorize, ok, zodError } from "@/lib/actions/action-utils";

const woSchema = z.object({
  date: z.coerce.date(),
  client: z.string().min(1),
  scopeOfWork: z.string().min(1),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  value: z.coerce.number().positive(),
  terms: z.string().optional().nullable(),
  siteId: z.string().optional().nullable(),
});

function cleanEmpty<T extends Record<string, unknown>>(data: T): T {
  const out = { ...data };
  for (const k of Object.keys(out)) if (out[k] === "") (out as Record<string, unknown>)[k] = null;
  return out;
}

export async function createWorkOrder(input: z.infer<typeof woSchema>) {
  const { user, error } = await authorize("invoices", "create");
  if (!user) return error;
  const parsed = woSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const wo = await prisma.$transaction(async (tx) => {
    const woNo = await generateDocumentNumber("WORK_ORDER", parsed.data.date, tx);
    return tx.workOrder.create({ data: { ...cleanEmpty(parsed.data), woNo, createdById: user.id } });
  });
  await prisma.auditLog.create({ data: { action: "WORK_ORDER_CREATED", entityType: "WorkOrder", entityId: wo.id, userId: user.id, metadata: { woNo: wo.woNo } } });
  revalidatePath("/work-orders");
  return ok(wo);
}

export async function updateWorkOrder(id: string, input: z.infer<typeof woSchema>) {
  const { user, error } = await authorize("invoices", "edit");
  if (!user) return error;
  const parsed = woSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const wo = await prisma.workOrder.update({ where: { id }, data: cleanEmpty(parsed.data) });
  await prisma.auditLog.create({ data: { action: "WORK_ORDER_UPDATED", entityType: "WorkOrder", entityId: id, userId: user.id } });
  revalidatePath("/work-orders");
  revalidatePath(`/work-orders/${id}`);
  return ok(wo);
}

export async function deleteWorkOrder(id: string) {
  const { user, error } = await authorize("invoices", "delete");
  if (!user) return error;
  await prisma.workOrder.delete({ where: { id } });
  await prisma.auditLog.create({ data: { action: "WORK_ORDER_DELETED", entityType: "WorkOrder", entityId: id, userId: user.id } });
  revalidatePath("/work-orders");
  return ok(undefined);
}

export async function updateWOStatus(id: string, status: "DRAFT" | "ISSUED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED") {
  const { user, error } = await authorize("invoices", "edit");
  if (!user) return error;
  const wo = await prisma.workOrder.update({ where: { id }, data: { status } });
  await prisma.auditLog.create({ data: { action: "WORK_ORDER_STATUS_CHANGED", entityType: "WorkOrder", entityId: id, userId: user.id, metadata: { status } } });
  revalidatePath(`/work-orders/${id}`);
  revalidatePath("/work-orders");
  return ok(wo);
}
