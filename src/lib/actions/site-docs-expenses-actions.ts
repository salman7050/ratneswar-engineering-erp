"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authorize, ok, zodError } from "@/lib/actions/action-utils";
import { deleteStoredFile } from "@/lib/supabase/storage-server";

function revalidateSite(siteId: string) {
  revalidatePath(`/sites/${siteId}`);
}

// ── Documents ─────────────────────────────────────────────────
const documentSchema = z.object({
  siteId: z.string().min(1),
  name: z.string().min(1),
  category: z.enum([
    "INSURANCE", "WORK_ORDER", "AGREEMENT", "INVOICE_BILL", "QUOTATION",
    "TESTING_REPORT", "STAFF_DOCUMENT", "ATTENDANCE", "TENDER_DOCUMENT", "OTHER",
  ]),
  fileUrl: z.string().min(1),
  fileSize: z.coerce.number().nonnegative(),
  mimeType: z.string().min(1),
});

export async function addSiteDocument(input: z.infer<typeof documentSchema>) {
  const { user, error } = await authorize("documents", "create");
  if (!user) return error;
  const parsed = documentSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const record = await prisma.document.create({
    data: { ...parsed.data, uploadedById: user.id },
  });
  revalidateSite(parsed.data.siteId);
  return ok(record);
}

export async function deleteSiteDocument(id: string, siteId: string) {
  const { user, error } = await authorize("documents", "delete");
  if (!user) return error;
  const document = await prisma.document.delete({ where: { id } });
  await deleteStoredFile(document.fileUrl);
  revalidateSite(siteId);
  return ok(undefined);
}

// ── Expenses ──────────────────────────────────────────────────

const expenseSchema = z.object({
  siteId: z.string().min(1),
  category: z.enum(["MATERIAL", "LABOUR", "FUEL", "TRANSPORT", "EQUIPMENT", "MISC"]),
  description: z.string().min(1),
  amount: z.coerce.number().positive(),
  date: z.coerce.date(),
});

export async function addSiteExpense(input: z.infer<typeof expenseSchema>) {
  const { user, error } = await authorize("expenses", "create");
  if (!user) return error;
  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const record = await prisma.expense.create({
    data: { ...parsed.data, createdById: user.id },
  });
  revalidateSite(parsed.data.siteId);
  return ok(record);
}

export async function deleteSiteExpense(id: string, siteId: string) {
  const { user, error } = await authorize("expenses", "delete");
  if (!user) return error;
  await prisma.expense.delete({ where: { id } });
  revalidateSite(siteId);
  return ok(undefined);
}
