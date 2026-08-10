"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authorize, fail, ok, zodError } from "@/lib/actions/action-utils";
import { deleteStoredFile } from "@/lib/supabase/storage-server";

function cleanEmpty<T extends Record<string, unknown>>(data: T): T {
  const out = { ...data };
  for (const key of Object.keys(out)) {
    if (out[key] === "") (out as Record<string, unknown>)[key] = null;
  }
  return out;
}

function refreshDocumentViews(document: {
  siteId?: string | null;
  tenderId?: string | null;
  employeeId?: string | null;
  poId?: string | null;
}) {
  revalidatePath("/documents");
  if (document.siteId) revalidatePath(`/sites/${document.siteId}`);
  if (document.tenderId) revalidatePath(`/tenders/${document.tenderId}`);
  if (document.employeeId) revalidatePath(`/employees/${document.employeeId}`);
  if (document.poId) revalidatePath(`/purchase-orders/${document.poId}`);
}

const CATEGORY_VALUES = [
  "INSURANCE", "CERTIFICATE", "WORK_ORDER", "AGREEMENT", "CONTRACT", "INVOICE_BILL",
  "QUOTATION", "TESTING_REPORT", "REPORT", "DRAWING", "PHOTO", "STAFF_DOCUMENT",
  "ATTENDANCE", "TENDER_DOCUMENT", "OTHER",
] as const;

const documentSchema = z.object({
  name: z.string().trim().min(1).max(240),
  category: z.enum(CATEGORY_VALUES),
  fileUrl: z.string().min(1),
  fileSize: z.coerce.number().int().nonnegative().max(25 * 1024 * 1024),
  mimeType: z.string().min(1).max(200),
  expiryDate: z.coerce.date().optional().nullable(),
  siteId: z.string().optional().nullable(),
  tenderId: z.string().optional().nullable(),
  employeeId: z.string().optional().nullable(),
  poId: z.string().optional().nullable(),
});

async function linkedRecordsExist(input: z.infer<typeof documentSchema>): Promise<boolean> {
  const checks = await Promise.all([
    input.siteId ? prisma.site.findUnique({ where: { id: input.siteId }, select: { id: true } }) : true,
    input.tenderId ? prisma.tender.findUnique({ where: { id: input.tenderId }, select: { id: true } }) : true,
    input.employeeId ? prisma.employee.findUnique({ where: { id: input.employeeId }, select: { id: true } }) : true,
    input.poId ? prisma.purchaseOrder.findUnique({ where: { id: input.poId }, select: { id: true } }) : true,
  ]);
  return checks.every(Boolean);
}

export async function createDocument(input: z.infer<typeof documentSchema>) {
  const { user, error } = await authorize("documents", "create");
  if (!user) return error;
  const parsed = documentSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);
  if (!(await linkedRecordsExist(parsed.data))) return fail("One of the linked records no longer exists.");

  const record = await prisma.document.create({
    data: { ...cleanEmpty(parsed.data), uploadedById: user.id },
  });

  await prisma.auditLog.create({
    data: { action: "DOCUMENT_UPLOADED", entityType: "Document", entityId: record.id, userId: user.id },
  });

  refreshDocumentViews(record);
  return ok(record);
}

const updateSchema = z.object({
  name: z.string().trim().min(1).max(240),
  category: z.enum(CATEGORY_VALUES),
  expiryDate: z.coerce.date().optional().nullable(),
});

export async function updateDocument(id: string, input: z.infer<typeof updateSchema>) {
  const { user, error } = await authorize("documents", "edit");
  if (!user) return error;
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const current = await prisma.document.findUnique({
    where: { id },
    select: { siteId: true, tenderId: true, employeeId: true, poId: true },
  });
  if (!current) return fail("Document not found.");

  const record = await prisma.document.update({ where: { id }, data: cleanEmpty(parsed.data) });
  await prisma.auditLog.create({
    data: { action: "DOCUMENT_UPDATED", entityType: "Document", entityId: id, userId: user.id },
  });
  refreshDocumentViews(current);
  return ok(record);
}

export async function deleteDocument(id: string) {
  const { user, error } = await authorize("documents", "delete");
  if (!user) return error;

  const current = await prisma.document.findUnique({
    where: { id },
    select: { fileUrl: true, siteId: true, tenderId: true, employeeId: true, poId: true },
  });
  if (!current) return fail("Document not found.");

  await prisma.$transaction([
    prisma.document.delete({ where: { id } }),
    prisma.auditLog.create({
      data: { action: "DOCUMENT_DELETED", entityType: "Document", entityId: id, userId: user.id },
    }),
  ]);
  await deleteStoredFile(current.fileUrl);
  refreshDocumentViews(current);
  return ok(undefined);
}
