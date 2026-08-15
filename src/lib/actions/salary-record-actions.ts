"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorize, fail, ok, zodError } from "@/lib/actions/action-utils";
import { deleteStoredFile } from "@/lib/supabase/storage-server";

const distributionSchema = z.object({
  label: z.string().min(1).max(200),
  type: z.enum(["EMPLOYEE_SALARY", "CASH_LABOUR", "OTHER"]),
  grossAmount: z.coerce.number().nonnegative(),
  netPaid: z.coerce.number().nonnegative(),
  isCash: z.boolean().default(false),
  siteHint: z.string().optional().nullable(),
});

const createSchema = z.object({
  periodKey: z.string().regex(/^20\d{2}-(0[1-9]|1[0-2])$/),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020).max(2100),
  title: z.string().min(1).max(200),
  salaryFileName: z.string().min(1).max(255),
  salaryFileUrl: z.string().min(1).max(1000),
  pfEmployee: z.coerce.number().nonnegative().default(0),
  pfEmployer: z.coerce.number().nonnegative().default(0),
  professionalTax: z.coerce.number().nonnegative().default(0),
  advanceRecovery: z.coerce.number().nonnegative().default(0),
  sourceSheet: z.string().max(200).optional(),
  cashLabourGross: z.coerce.number().nonnegative().optional(),
  distributions: z.array(distributionSchema).min(1),
});

async function matchSiteId(hint?: string | null) {
  if (!hint) return null;
  const normalized = hint.toUpperCase();
  const aliases: Record<string, string[]> = {
    "SHPP-1": ["SHPP-1", "SHP-1", "SBC"],
    "PS-1 SS": ["PS-1 SS", "PS 1 SS", "PS-1"],
    "PS-2 PH-2": ["PS-2 PH-2", "PS 2 PH 2", "PS-2 PUMP"],
    "PS-2 SS": ["PS-2 SS", "PS 2 SS"],
    "PS-3 PH-2": ["PS-3 PH-2", "PS 3 PH 2", "PS-3 PUMP"],
    "PS-3 SS": ["PS-3 SS", "PS 3 SS"],
    "GOKUL": ["GOKUL", "2900", "2.9 MW"],
  };
  const needles = aliases[normalized] ?? [hint];
  for (const needle of needles) {
    const site = await prisma.site.findFirst({ where: { OR: [{ name: { contains: needle, mode: "insensitive" } }, { siteCode: { contains: needle, mode: "insensitive" } }] }, select: { id: true } });
    if (site) return site.id;
  }
  return null;
}

export async function createSalaryMonthlyRecord(input: z.input<typeof createSchema>) {
  const { user, error } = await authorize("salary", "create");
  if (!user) return error;
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);
  const existing = await prisma.salaryMonthlyRecord.findUnique({ where: { periodKey: parsed.data.periodKey }, select: { id: true } });
  if (existing) return fail(`Salary record for ${parsed.data.periodKey} already exists. Delete/replace that record instead of creating a duplicate.`);

  const employeeRows = parsed.data.distributions.filter((d) => d.type !== "CASH_LABOUR");
  const cashRows = parsed.data.distributions.filter((d) => d.type === "CASH_LABOUR");
  const employeeGross = employeeRows.reduce((sum, row) => sum + row.grossAmount, 0);
  const bankPayable = employeeRows.reduce((sum, row) => sum + row.netPaid, 0);
  const cashLabour = cashRows.reduce((sum, row) => sum + row.netPaid, 0);
  const cashLabourGross = cashRows.reduce((sum, row) => sum + row.grossAmount, 0);
  const totalManpowerCost = employeeGross + cashLabourGross;

  const distributions = [] as Array<{ label: string; type: "EMPLOYEE_SALARY" | "CASH_LABOUR" | "OTHER"; grossAmount: number; netPaid: number; isCash: boolean; sortOrder: number; siteId: string | null }>;
  for (const [index, row] of parsed.data.distributions.entries()) {
    distributions.push({ label: row.label, type: row.type, grossAmount: row.grossAmount, netPaid: row.netPaid, isCash: row.isCash, sortOrder: index, siteId: await matchSiteId(row.siteHint) });
  }

  const record = await prisma.salaryMonthlyRecord.create({
    data: {
      periodKey: parsed.data.periodKey,
      month: parsed.data.month,
      year: parsed.data.year,
      title: parsed.data.title,
      salaryFileName: parsed.data.salaryFileName,
      salaryFileUrl: parsed.data.salaryFileUrl,
      employeeGross,
      bankPayable,
      cashLabour,
      totalManpowerCost,
      pfEmployee: parsed.data.pfEmployee,
      pfEmployer: parsed.data.pfEmployer,
      professionalTax: parsed.data.professionalTax,
      advanceRecovery: parsed.data.advanceRecovery,
      status: "FINAL",
      parsedSummary: { sourceSheet: parsed.data.sourceSheet || null, cashLabourGross, rule: "Employee gross excludes Rattilal cash labour; Rattilal is tracked separately." } as Prisma.InputJsonValue,
      createdById: user.id,
      distributions: { create: distributions },
    },
  });

  await prisma.auditLog.create({ data: { action: "SALARY_MONTH_ARCHIVED", entityType: "SalaryMonthlyRecord", entityId: record.id, userId: user.id, metadata: { periodKey: record.periodKey, employeeGross, bankPayable, cashLabour } } });
  revalidatePath("/salary"); revalidatePath("/expenses"); revalidatePath("/analytics"); revalidatePath("/dashboard");
  return ok({ id: record.id, periodKey: record.periodKey });
}

const bankSchema = z.object({ id: z.string(), fileName: z.string().min(1), fileUrl: z.string().min(1), bankTotal: z.coerce.number().positive() });
export async function attachSalaryBankFile(input: z.infer<typeof bankSchema>) {
  const { user, error } = await authorize("salary", "edit");
  if (!user) return error;
  const parsed = bankSchema.safeParse(input); if (!parsed.success) return zodError(parsed.error);
  const current = await prisma.salaryMonthlyRecord.findUnique({ where: { id: parsed.data.id } });
  if (!current) return fail("Salary record not found.");
  const expected = Number(current.bankPayable);
  const difference = Math.round((parsed.data.bankTotal - expected) * 100) / 100;
  const oldSummary = current.parsedSummary && typeof current.parsedSummary === "object" && !Array.isArray(current.parsedSummary) ? current.parsedSummary as Record<string, unknown> : {};
  const updated = await prisma.salaryMonthlyRecord.update({ where: { id: current.id }, data: { bankFileName: parsed.data.fileName, bankFileUrl: parsed.data.fileUrl, parsedSummary: { ...oldSummary, bankFileTotal: parsed.data.bankTotal, bankDifference: difference, bankMatched: Math.abs(difference) < 0.01 } as Prisma.InputJsonValue } });
  await prisma.auditLog.create({ data: { action: "SALARY_BANK_FILE_ATTACHED", entityType: "SalaryMonthlyRecord", entityId: current.id, userId: user.id, metadata: { bankTotal: parsed.data.bankTotal, expected, difference } } });
  revalidatePath("/salary");
  return ok({ id: updated.id, expected, bankTotal: parsed.data.bankTotal, difference, matched: Math.abs(difference) < 0.01 });
}

const proofSchema = z.object({ id: z.string(), fileName: z.string().min(1), fileUrl: z.string().min(1) });
export async function attachSalaryPaymentProof(input: z.infer<typeof proofSchema>) {
  const { user, error } = await authorize("salary", "edit");
  if (!user) return error;
  const parsed = proofSchema.safeParse(input); if (!parsed.success) return zodError(parsed.error);
  const current = await prisma.salaryMonthlyRecord.findUnique({ where: { id: parsed.data.id } });
  if (!current) return fail("Salary record not found.");
  const updated = await prisma.salaryMonthlyRecord.update({ where: { id: current.id }, data: { paymentProofName: parsed.data.fileName, paymentProofUrl: parsed.data.fileUrl, status: "PAID" } });
  await prisma.auditLog.create({ data: { action: "SALARY_PAYMENT_PROOF_ATTACHED", entityType: "SalaryMonthlyRecord", entityId: current.id, userId: user.id } });
  revalidatePath("/salary"); revalidatePath("/expenses"); revalidatePath("/analytics");
  return ok({ id: updated.id });
}

export async function setSalaryRecordStatus(id: string, status: "FINAL" | "PAID") {
  const { user, error } = await authorize("salary", "edit");
  if (!user) return error;
  const current = await prisma.salaryMonthlyRecord.findUnique({ where: { id }, select: { id: true } });
  if (!current) return fail("Salary record not found.");
  const updated = await prisma.salaryMonthlyRecord.update({ where: { id }, data: { status } });
  await prisma.auditLog.create({ data: { action: `SALARY_RECORD_${status}`, entityType: "SalaryMonthlyRecord", entityId: id, userId: user.id } });
  revalidatePath("/salary"); revalidatePath("/expenses");
  return ok({ id: updated.id });
}

export async function deleteSalaryMonthlyRecord(id: string) {
  const { user, error } = await authorize("salary", "delete");
  if (!user) return error;
  const current = await prisma.salaryMonthlyRecord.findUnique({ where: { id } });
  if (!current) return fail("Salary record not found.");
  await prisma.salaryMonthlyRecord.delete({ where: { id } });
  await Promise.allSettled([deleteStoredFile(current.salaryFileUrl), current.bankFileUrl ? deleteStoredFile(current.bankFileUrl) : Promise.resolve(), current.paymentProofUrl ? deleteStoredFile(current.paymentProofUrl) : Promise.resolve()]);
  await prisma.auditLog.create({ data: { action: "SALARY_MONTH_DELETED", entityType: "SalaryMonthlyRecord", entityId: id, userId: user.id, metadata: { periodKey: current.periodKey } } });
  revalidatePath("/salary"); revalidatePath("/expenses"); revalidatePath("/analytics");
  return ok(undefined);
}
