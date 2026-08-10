"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authorize, ok, zodError } from "@/lib/actions/action-utils";

function revalidateEmployee(employeeId: string) {
  revalidatePath(`/employees/${employeeId}`);
  revalidatePath("/employees");
}

// ── Promotion ─────────────────────────────────────────────────

const promotionSchema = z.object({
  employeeId: z.string().min(1),
  fromDesignation: z.string().min(1),
  toDesignation: z.string().min(1),
  effectiveDate: z.coerce.date(),
  notes: z.string().optional().nullable(),
});

export async function addPromotion(input: z.infer<typeof promotionSchema>) {
  const { user, error } = await authorize("employees", "edit");
  if (!user) return error;
  const parsed = promotionSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const [record] = await prisma.$transaction([
    prisma.promotionRecord.create({ data: parsed.data }),
    prisma.employee.update({ where: { id: parsed.data.employeeId }, data: { designation: parsed.data.toDesignation } }),
  ]);

  revalidateEmployee(parsed.data.employeeId);
  return ok(record);
}

export async function deletePromotion(id: string, employeeId: string) {
  const { user, error } = await authorize("employees", "edit");
  if (!user) return error;
  await prisma.promotionRecord.delete({ where: { id } });
  revalidateEmployee(employeeId);
  return ok(undefined);
}

// ── Increment ─────────────────────────────────────────────────

const incrementSchema = z.object({
  employeeId: z.string().min(1),
  previousBasic: z.coerce.number().positive(),
  newBasic: z.coerce.number().positive(),
  effectiveDate: z.coerce.date(),
  notes: z.string().optional().nullable(),
});

export async function addIncrement(input: z.infer<typeof incrementSchema>) {
  const { user, error } = await authorize("employees", "edit");
  if (!user) return error;
  const parsed = incrementSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const [record] = await prisma.$transaction([
    prisma.incrementRecord.create({ data: parsed.data }),
    prisma.employee.update({ where: { id: parsed.data.employeeId }, data: { basic: parsed.data.newBasic } }),
  ]);

  revalidateEmployee(parsed.data.employeeId);
  return ok(record);
}

export async function deleteIncrement(id: string, employeeId: string) {
  const { user, error } = await authorize("employees", "edit");
  if (!user) return error;
  await prisma.incrementRecord.delete({ where: { id } });
  revalidateEmployee(employeeId);
  return ok(undefined);
}
