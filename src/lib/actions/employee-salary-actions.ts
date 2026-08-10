"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authorize, ok, fail, zodError } from "@/lib/actions/action-utils";

const slipSchema = z.object({
  employeeId: z.string().min(1),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020).max(2100),
  presentDays: z.coerce.number().int().nonnegative(),
  totalDays: z.coerce.number().int().positive(),
  otHours: z.coerce.number().nonnegative().default(0),
  otRate: z.coerce.number().nonnegative().default(0),
  advanceDeduction: z.coerce.number().nonnegative().default(0),
});

/** Gujarat Professional Tax monthly slab (simplified, flat monthly rates). */
function professionalTax(gross: number): number {
  if (gross <= 5999) return 0;
  if (gross <= 8999) return 80;
  if (gross <= 11999) return 150;
  return 200;
}

export async function addSalarySlip(input: z.infer<typeof slipSchema>) {
  const { user, error } = await authorize("salary", "create");
  if (!user) return error;

  const parsed = slipSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);
  const { employeeId, month, year, presentDays, totalDays, otHours, otRate, advanceDeduction } = parsed.data;

  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) return fail("Employee not found.");

  const monthlyPay = Number(employee.basic) + Number(employee.hra) + Number(employee.otherAllowance);
  const proratedPay = (monthlyPay * presentDays) / totalDays;
  const otPay = otHours * otRate;
  const grossPay = Math.round((proratedPay + otPay) * 100) / 100;

  const pfBasis = Math.min(Number(employee.basic), 15000) * (presentDays / totalDays);
  const pfEmployee = employee.pfEnrolled ? Math.round(pfBasis * 0.12 * 100) / 100 : 0;
  const pfEmployer = pfEmployee;
  const pt = professionalTax(grossPay);
  const netPay = Math.round((grossPay - pfEmployee - pt - advanceDeduction) * 100) / 100;

  const record = await prisma.salarySlip.upsert({
    where: { employeeId_month_year: { employeeId, month, year } },
    update: { presentDays, totalDays, otHours, otRate, advanceDeduction, grossPay, pfEmployee, pfEmployer, professionalTax: pt, netPay },
    create: { employeeId, month, year, presentDays, totalDays, otHours, otRate, advanceDeduction, grossPay, pfEmployee, pfEmployer, professionalTax: pt, netPay },
  });

  revalidatePath(`/employees/${employeeId}`);
  revalidatePath("/salary");
  revalidatePath("/analytics");
  return ok(record);
}

export async function deleteSalarySlip(id: string, employeeId: string) {
  const { user, error } = await authorize("salary", "delete");
  if (!user) return error;
  await prisma.salarySlip.delete({ where: { id } });
  revalidatePath(`/employees/${employeeId}`);
  revalidatePath("/salary");
  revalidatePath("/analytics");
  return ok(undefined);
}

export async function updateSalaryStatus(id: string, status: "DRAFT" | "APPROVED" | "PAID") {
  const permission = status === "APPROVED" ? "approve" : "edit";
  const { user, error } = await authorize("salary", permission);
  if (!user) return error;

  const current = await prisma.salarySlip.findUnique({ where: { id }, select: { employeeId: true } });
  if (!current) return fail("Salary slip not found.");

  const record = await prisma.salarySlip.update({
    where: { id },
    data: {
      status,
      approvedById: status === "DRAFT" ? null : user.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: `SALARY_${status}`,
      entityType: "SalarySlip",
      entityId: id,
      userId: user.id,
    },
  });

  revalidatePath(`/employees/${current.employeeId}`);
  revalidatePath("/salary");
  revalidatePath("/analytics");
  return ok(record);
}
